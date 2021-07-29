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
import {die, jsonStringify, Maybe} from '../misc';
import {pluralCategories, PluralCategory, RuntimeMethod} from 'mfml-runtime';
import {compilePropertyName} from '@smikhalevski/codegen';

export interface INodeCompilerOptions {

  /**
   * If `true` then `plural`, `select` and `selectordinal` are allowed to render `null` if no cases matched. Otherwise
   * an empty string is rendered.
   *
   * @default false
   */
  nullable?: boolean;

  /**
   * The key that is used as the default for `select`.
   *
   * @default "other"
   */
  otherSelectCaseKey?: string;

  /**
   * The name of the temporary variable used by `plural`, `select` and `selectordinal` to store the detected index.
   */
  indexVarName: string;

  /**
   * Returns the name of the the variable that holds an argument value.
   */
  provideArgumentVarName(argumentName: string): string;

  /**
   * Triggered if a function node was rendered.
   *
   * @param node The node that was rendered.
   */
  onFunctionUsed?(node: IFunctionNode): void;

  /**
   * Triggered if a select node was rendered.
   *
   * @param node The node that was rendered.
   */
  onSelectUsed?(node: ISelectNode): void;

  /**
   * Triggered if a runtime method usage was rendered.
   *
   * @param runtimeMethod The name of the used runtime method.
   * @param indexVarUsed `true` if the method used an index var to store temporary runtime result.
   */
  onRuntimeMethodUsed?(runtimeMethod: RuntimeMethod, indexVarUsed: boolean): void;
}

/**
 * Compiles an AST node to a source code. This may return an empty string if an AST nodes doesn't describe any
 * meaningful value.
 *
 * @param node The node to compile.
 * @param options The compiler options.
 */
export function compileNode(node: Node, options: INodeCompilerOptions): string {

  const {
    otherSelectCaseKey = 'other',
    provideArgumentVarName,
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

    for (const child of node.children) {
      if (!isBlankNode(child) && ++childrenCount === 2) {
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
      onRuntimeMethodUsed?.(RuntimeMethod.FRAGMENT, false);
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

      const attrCount = node.attributes.length;

      if (attrCount !== 0) {
        onRuntimeMethodUsed?.(RuntimeMethod.ELEMENT, false);
        src += RuntimeMethod.ELEMENT;
      } else {
        onRuntimeMethodUsed?.(RuntimeMethod.SHORT_ELEMENT, false);
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

      onRuntimeMethodUsed?.(RuntimeMethod.ARGUMENT, false);
      src += RuntimeMethod.ARGUMENT + `(${provideArgumentVarName(node.name)})`;
    },

    function(node, next) {
      enterChild();

      onFunctionUsed?.(node);
      onRuntimeMethodUsed?.(RuntimeMethod.FUNCTION, false);
      src += RuntimeMethod.FUNCTION + `(${jsonStringify(node.name)},${provideArgumentVarName(node.argumentName)}`;

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

        onRuntimeMethodUsed?.(RuntimeMethod.ARGUMENT, false);
        src += RuntimeMethod.ARGUMENT + `(${provideArgumentVarName(selectNode.argumentName)})`;
      } else {
        die('Octothorpe must be nested in a select');
      }
    },
  });

  return src;
}

/**
 * Compiles a select node to a source code.
 *
 * @param node The select node to compile.
 * @param runtimeMethod The runtime method name that is used to resolve what case to use.
 * @param otherSelectCaseKey The case key that would be a default.
 * @param knownKeys The list of case keys that are used. If `undefined` then all case keys from `node` are used.
 * @param options The node compiler options.
 *
 * @returns The compiled source.
 */
function compileSelect(
    node: ISelectNode,
    runtimeMethod: RuntimeMethod,
    otherSelectCaseKey: string,
    knownKeys: Array<string> | undefined,
    options: INodeCompilerOptions,
): string {

  const {
    nullable,
    provideArgumentVarName,
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

  for (let i = 0; i < knownKeys.length; ++i) {
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
      ++childrenCount;
    }
  }

  onSelectUsed?.(node);

  let src = '';
  if (childrenCount === 0) {
    return otherNode ? compileNode(otherNode, options) : src;
  }
  if (childrenCount > 1) {
    src += `(${indexVarName}=`;
  }

  onRuntimeMethodUsed?.(runtimeMethod, childrenCount > 1);
  src += runtimeMethod
      + '('
      + provideArgumentVarName(node.argumentName)
      + (keysRetained ? ',' + knownKeys.map(jsonStringify).join(',') : '')
      + ')';

  const otherSrc = otherNode != null ? compileNode(otherNode, options) : compileBlankValue(nullable);

  src += childrenCount > 1 ? `,${indexVarName}${childrenSrc}:${otherSrc})` : childrenSrc + ':' + otherSrc;
  return src;
}

export function compileBlankValue(nullable: Maybe<boolean>): string {
  return nullable ? 'null' : '""';
}
