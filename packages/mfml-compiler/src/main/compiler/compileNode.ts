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
import {pluralCategories, PluralCategory, RuntimeMethod} from 'mfml-runtime';
import {compilePropertyName} from '@smikhalevski/codegen';

export interface INodeCompilerOptions {

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
   * The locale var name or a source code of a literal locale string.
   */
  localeSrc: string;

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
export function compileNode(node: Node, options: Readonly<INodeCompilerOptions>): string {

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
      src += compileSelect(node, RuntimeMethod.PLURAL, PluralCategory.OTHER, true, options);
    },

    selectOrdinal(node) {
      enterChild();
      src += compileSelect(node, RuntimeMethod.SELECT_ORDINAL, PluralCategory.OTHER, true, options);
    },

    select(node) {
      enterChild();
      src += compileSelect(node, RuntimeMethod.SELECT, otherSelectCaseKey, false, options);
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
 * @param plural If `true` then runtime method call is formatted like plural.
 * @param options The node compiler options.
 *
 * @returns The compiled source.
 */
function compileSelect(
    node: ISelectNode,
    runtimeMethod: RuntimeMethod,
    otherSelectCaseKey: string,
    plural: boolean,
    options: Readonly<INodeCompilerOptions>,
): string {

  const {
    provideArgumentVarName,
    indexVarName,
    localeSrc,
    onRuntimeMethodUsed,
    onSelectUsed,
  } = options;

  let knownKeys: Array<string>;

  if (plural) {
    knownKeys = pluralCategories;
  } else {
    knownKeys = [];

    for (const childNode of node.children) {
      if (knownKeys.indexOf(childNode.key) === -1) {
        knownKeys.push(childNode.key);
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
      + (plural ? localeSrc + ',' : '')
      + provideArgumentVarName(node.argumentName)
      + (plural ? '' : ',' + knownKeys.map(jsonStringify).join(','))
      + ')';

  let otherSrc;

  if (otherNode != null) {
    otherSrc = compileNode(otherNode, options);
  } else {
    otherSrc = compileEmptyFragment(onRuntimeMethodUsed);
  }

  src += childrenCount > 1 ? `,${indexVarName}${childrenSrc}:${otherSrc})` : childrenSrc + ':' + otherSrc;
  return src;
}

/**
 * Compiles an empty fragment and notifies a listener.
 *
 * @param onRuntimeMethodUsed The listener to notify.
 */
export function compileEmptyFragment(onRuntimeMethodUsed: INodeCompilerOptions['onRuntimeMethodUsed']): string {
  onRuntimeMethodUsed?.(RuntimeMethod.FRAGMENT, false);
  return RuntimeMethod.FRAGMENT + '()';
}
