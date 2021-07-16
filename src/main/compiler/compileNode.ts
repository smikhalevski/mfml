import {
  ContainerNode,
  IFunctionNode,
  isBlankNode,
  ISelectCaseNode,
  ISelectNode,
  isSelectNode,
  ITextNode,
  Node,
} from '../parser';
import {visitNode} from './visitNode';
import {die, jsonStringify} from '../misc';
import {pluralCategories, PluralCategory} from '../runtime/PluralCategory';
import {RuntimeMethod} from '../runtime';
import {compilePropertyName} from '@smikhalevski/codegen';

export interface INodeCompilerDialectOptions {

  /**
   * If `true` then `plural`, `select` and `selectordinal` are allowed to render `null` if no cases matched. Otherwise
   * an empty string is rendered.
   */
  nullable: boolean;

  /**
   * The key that is used as the default for `select`.
   */
  otherSelectCaseKey: string;
}

export interface INodeCompilerOptions extends INodeCompilerDialectOptions {

  /**
   * Returns the name of the the variable that holds an argument value.
   */
  provideArgVarName: (argName: string) => string;

  /**
   * The name of the temporary variable used by `plural`, `select` and `selectordinal` to store the detected index.
   */
  indexVarName: string;

  /**
   * Triggered if a function node was rendered.
   *
   * @param node The node that was rendered.
   */
  onFunctionUsed: (node: IFunctionNode) => void;

  /**
   * Triggered if a select node was rendered.
   *
   * @param node The node that was rendered.
   * @param selectVarUsed `true` if {@link indexVarName} was rendered.
   */
  onSelectUsed: (node: ISelectNode) => void;

  /**
   * Triggered if a runtime method usage was rendered.
   */
  onRuntimeMethodUsed: (runtimeMethod: RuntimeMethod, indexVarUsed: boolean) => void;
}

/**
 * Compiles an AST node as a source code. This may return an empty string if
 *
 * @param node The node to compile.
 * @param options Compilation options.
 */
export function compileNode(node: Node, options: INodeCompilerOptions): string {
  const {
    otherSelectCaseKey,
    provideArgVarName,
    onFunctionUsed,
    onRuntimeMethodUsed,
  } = options;

  let src = '';
  let separatorRequired = false;

  const enterChild = () => {
    if (separatorRequired) {
      src += ',';
    }
    separatorRequired = true;
  };

  const enterBlock = () => {
    separatorRequired = false;
  };

  const compileFragment = (node: ContainerNode, next: () => void) => {
    let childrenCount = 0;
    for (let i = 0, children = node.children; i < children.length; i++) {
      if (!isBlankNode(children[i]) && ++childrenCount === 2) {
        break;
      }
    }
    if (childrenCount === 0) {
      return;
    }
    if (childrenCount === 1) {
      next();
      return;
    }
    enterChild();
    if (childrenCount > 1) {
      onRuntimeMethodUsed(RuntimeMethod.FRAGMENT, false);
      src += RuntimeMethod.FRAGMENT + '(';
      enterBlock();
      next();
      src += ')';
    }
  };

  visitNode(node, {

    fragment: compileFragment,
    selectCase: compileFragment,

    element(node, nextAttributes, nextChildren) {
      enterChild();

      const attrCount = node.attrs.length;

      if (attrCount !== 0) {
        onRuntimeMethodUsed(RuntimeMethod.ELEMENT, false);
        src += RuntimeMethod.ELEMENT;
      } else {
        onRuntimeMethodUsed(RuntimeMethod.SHORT_ELEMENT, false);
        src += RuntimeMethod.SHORT_ELEMENT;
      }

      src += '(' + jsonStringify(node.tagName);

      if (attrCount > 0) {
        src += ',{';
        enterBlock();
        nextAttributes();
        src += '}';
      }
      nextChildren();
      src += ')';
    },

    attribute(node, next) {
      enterChild();

      src += compilePropertyName(node.name) + ':';

      if (node.children.length === 0) {
        src += 'true';
      } else {
        enterBlock();
        compileFragment(node, next);
      }
    },

    text(node: ITextNode) {
      if (isBlankNode(node)) {
        return;
      }
      enterChild();
      src += jsonStringify(node.value);
    },

    argument(node) {
      enterChild();

      onRuntimeMethodUsed(RuntimeMethod.ARGUMENT, false);
      src += RuntimeMethod.ARGUMENT + `(${provideArgVarName(node.name)})`;
    },

    function(node, next) {
      enterChild();

      onFunctionUsed(node);
      onRuntimeMethodUsed(RuntimeMethod.FUNCTION, false);
      src += RuntimeMethod.FUNCTION + `(${jsonStringify(node.name)},${provideArgVarName(node.argName)}`;

      compileFragment(node, next);
      src += ')';
    },

    plural(node) {
      enterChild();
      src += compileSelect(node, RuntimeMethod.PLURAL, PluralCategory.OTHER, pluralCategories, options);
    },

    selectOrdinal(node) {
      enterChild();
      src += compileSelect(node, RuntimeMethod.SELECT_ORDINAL, PluralCategory.OTHER, pluralCategories, options);
    },

    select(node) {
      enterChild();
      src += compileSelect(node, RuntimeMethod.SELECT, otherSelectCaseKey, undefined, options);
    },

    octothorpe(node) {
      let selectNode = node.parent;

      while (selectNode != null && !isSelectNode(selectNode)) {
        selectNode = selectNode.parent;
      }
      if (selectNode) {
        enterChild();

        onRuntimeMethodUsed(RuntimeMethod.ARGUMENT, false);
        src += RuntimeMethod.ARGUMENT + `(${provideArgVarName(selectNode.argName)})`;
      } else {
        die('Octothorpe must be nested in a select');
      }
    },
  });

  return src;
}

function compileSelect(node: ISelectNode, runtimeMethod: RuntimeMethod, otherSelectCaseKey: string, knownKeys: Array<string> | undefined, options: INodeCompilerOptions): string {
  const {
    nullable,
    provideArgVarName,
    indexVarName,
    onRuntimeMethodUsed,
    onSelectUsed,
  } = options;

  // If true then case keys are retained at runtime
  let keysRetained = false;

  if (!knownKeys) {
    keysRetained = true;
    knownKeys = [];

    for (const child of node.children) {
      if (knownKeys.indexOf(child.key) === -1) {
        knownKeys.push(child.key);
      }
    }
  }

  let otherNode: ISelectCaseNode | undefined;
  let childrenSrc = '';
  let childrenCount = 0;

  for (let i = 0; i < knownKeys.length; i++) {
    for (const child of node.children) {
      if (child.key !== knownKeys[i] || isBlankNode(child)) {
        continue;
      }
      if (child.key === otherSelectCaseKey) {
        otherNode = child;
        continue;
      }
      if (childrenCount > 0) {
        childrenSrc += ':' + indexVarName;
      }
      childrenSrc += `===${i}?` + compileNode(child, options);
      childrenCount++;
    }
  }

  onSelectUsed(node);

  let src = '';
  if (childrenCount === 0) {
    return otherNode ? compileNode(otherNode, options) : src;
  }
  if (childrenCount > 1) {
    src += `(${indexVarName}=`;
  }

  onRuntimeMethodUsed(runtimeMethod, childrenCount > 1);
  src += runtimeMethod
      + '('
      + provideArgVarName(node.argName)
      + (keysRetained ? ',' + knownKeys.map(jsonStringify).join(',') : '')
      + ')';

  const otherSrc = otherNode ? compileNode(otherNode, options) : compileDefaultValue(nullable);

  src += childrenCount > 1 ? `,${indexVarName}${childrenSrc}:${otherSrc})` : childrenSrc + ':' + otherSrc;
  return src;
}

export function compileDefaultValue(nullable: boolean): string {
  return nullable ? 'null' : '""';
}
