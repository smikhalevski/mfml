import {
  ContainerNode,
  getSignificantSize,
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
   * @default `"other"`
   */
  otherSelectCaseKey?: string;

  /**
   * The name of the temporary variable used by `plural`, `select` and `selectordinal` to store the detected index.
   */
  indexVarName: string;

  /**
   * The name of the variable that holds a locale or a source code of a literal locale string.
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
 * @param [attributeMode = false] If `true` then attribute runtime methods are used.
 */
export function compileNode(node: Node, options: Readonly<INodeCompilerOptions>, attributeMode = false): string {

  const {
    localeSrc,
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
    const size = getSignificantSize(node.children);
    if (size === 0) {
      return;
    }
    if (size === 1) {
      next();
      return;
    }
    enterChild();
    if (size > 1) {

      const runtimeMethod = attributeMode ? RuntimeMethod.ATTRIBUTE_FRAGMENT : RuntimeMethod.FRAGMENT;

      onRuntimeMethodUsed?.(runtimeMethod, false);
      src += runtimeMethod + '(';

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

      onRuntimeMethodUsed?.(RuntimeMethod.ELEMENT, false);
      src += RuntimeMethod.ELEMENT + '(' + jsonStringify(node.tagName);

      if (node.attributes.length > 0) {
        src += ',{';
        enterBlock();

        attributeMode = true;
        nextAttributes();
        attributeMode = false;

        src += '}';
      } else {
        src += ',null';
      }

      nextChildren();
      src += ')';
    },

    attribute(node, next) {
      enterChild();

      src += compilePropertyName(node.name) + ':';

      if (node.children.length === 0) {
        src += 'true';
        return;
      }
      if (getSignificantSize(node.children) === 0) {
        src += '""';
        return;
      }
      enterBlock();
      compileFragment(node, next);
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

      const runtimeMethod = attributeMode ? RuntimeMethod.ATTRIBUTE_ARGUMENT : RuntimeMethod.ARGUMENT;

      onRuntimeMethodUsed?.(runtimeMethod, false);
      src += runtimeMethod + `(${localeSrc},${provideArgumentVarName(node.name)})`;
    },

    function(node, next) {
      enterChild();

      const runtimeMethod = attributeMode ? RuntimeMethod.ATTRIBUTE_FUNCTION : RuntimeMethod.FUNCTION;

      onFunctionUsed?.(node);
      onRuntimeMethodUsed?.(runtimeMethod, false);
      src += runtimeMethod + `(${localeSrc},${provideArgumentVarName(node.argumentName)},${jsonStringify(node.name)}`;

      compileFragment(node, next);
      src += ')';
    },

    plural(node) {
      enterChild();
      src += compileSelect(node, RuntimeMethod.PLURAL, attributeMode, PluralCategory.OTHER, true, options);
    },

    selectOrdinal(node) {
      enterChild();
      src += compileSelect(node, RuntimeMethod.SELECT_ORDINAL, attributeMode, PluralCategory.OTHER, true, options);
    },

    select(node) {
      enterChild();
      src += compileSelect(node, RuntimeMethod.SELECT, attributeMode, otherSelectCaseKey, false, options);
    },

    octothorpe(node) {
      let selectNode = node.parent;

      while (selectNode != null && !isSelectNode(selectNode)) {
        selectNode = selectNode.parent;
      }
      if (selectNode) {
        enterChild();

        onRuntimeMethodUsed?.(RuntimeMethod.ARGUMENT, false);
        src += RuntimeMethod.ARGUMENT + `(${localeSrc},${provideArgumentVarName(selectNode.argumentName)})`;
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
 * @param attributeMode If `true` then attribute runtime methods are used.
 * @param otherSelectCaseKey The case key that would be a default.
 * @param plural If `true` then runtime method call is formatted like plural.
 * @param options The node compiler options.
 *
 * @returns The compiled source.
 */
function compileSelect(
    node: ISelectNode,
    runtimeMethod: RuntimeMethod,
    attributeMode: boolean,
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
    for (const childNode of node.children) {
      if (childNode.key !== knownKeys[i] || isBlankNode(childNode)) {
        continue;
      }
      if (childNode.key === otherSelectCaseKey) {
        otherNode = childNode;
        continue;
      }
      if (childrenCount > 0) {
        childrenSrc += ':' + indexVarName;
      }
      childrenSrc += `===${i}?` + compileNode(childNode, options, attributeMode);
      ++childrenCount;
    }
  }

  onSelectUsed?.(node);

  let src = '';
  if (childrenCount === 0) {
    return otherNode ? compileNode(otherNode, options, attributeMode) : src;
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
    otherSrc = compileNode(otherNode, options, attributeMode);
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
