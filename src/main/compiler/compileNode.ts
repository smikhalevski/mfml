import {ContainerNode, isBlankNode, ISelectCaseNode, ISelectNode, isSelectNode, ITextNode, Node} from '../parser';
import {visitNode} from './visitNode';
import {dieAtOffset} from '../misc';
import {pluralCategories, PluralCategory} from '../runtime/pluralCategories';
import {RuntimeMethod} from '../runtime';
import {compilePropertyName} from '@smikhalevski/codegen';

/**
 * Variable name that keeps temporary index returned by `plural`, `select` and `selectordinal`.
 */
export const TEMP_VAR_NAME = 'i';

/**
 * The type of the argument used in `plural` and `selectordinal`.
 */
export const ORDINAL_ARG_TYPE = 'number';

export interface INodeCompilerOptions {

  renameTag: (name: string) => string;
  renameAttribute: (name: string) => string;
  renameFunction: (name: string) => string;

  /**
   * If `true` then `plural`, `select` and `selectordinal` are allowed to render `null` if no cased matched. Otherwise
   * an empty string is rendered.
   */
  nullable: boolean;

  /**
   * Returns the type of an argument that a formatting function accepts.
   */
  getFunctionArgumentType: (name: string) => string | undefined;

  // ----------------------

  /**
   * Returns the name of the the variable that holds an argument value.
   */
  getArgumentVarName: (argName: string) => string;

  /**
   * Triggered when an argument type is changed during compilation.
   *
   * @param argName The original argument name.
   * @param argType The new argument type.
   */
  onArgumentTypeChanged: (argName: string, argType: string | undefined) => void;

  /**
   * Triggered if a runtime method usage was rendered.
   */
  onRuntimeMethodUsed: (runtimeMethod: RuntimeMethod) => void;
}

/**
 * Compiles an AST node as a source code.
 *
 * @param node The node to compile.
 * @param options Compilation options.
 */
export function compileNode(node: Node, options: INodeCompilerOptions): string {
  const {
    renameTag,
    renameAttribute,
    renameFunction,
    nullable,
    getArgumentVarName,
    getFunctionArgumentType,
    onArgumentTypeChanged,
    onRuntimeMethodUsed,
  } = options;

  let src = '';
  let requiresSeparator = false;

  const enterChild = () => {
    if (requiresSeparator) {
      src += ',';
    }
    requiresSeparator = true;
  };

  const enterBlock = () => {
    requiresSeparator = false;
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
      onRuntimeMethodUsed(RuntimeMethod.FRAGMENT);

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
        onRuntimeMethodUsed(RuntimeMethod.ELEMENT);
        src += RuntimeMethod.ELEMENT;
      } else {
        onRuntimeMethodUsed(RuntimeMethod.SHORT_ELEMENT);
        src += RuntimeMethod.SHORT_ELEMENT;
      }

      src += `(${JSON.stringify(renameTag(node.tagName))}`;

      if (attrCount !== 0) {
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

      src += compilePropertyName(renameAttribute(node.name)) + ':';

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
      src += JSON.stringify(node.value);
    },

    argument(node) {
      enterChild();

      onRuntimeMethodUsed(RuntimeMethod.ARGUMENT);

      src += RuntimeMethod.ARGUMENT + `(${getArgumentVarName(node.name)})`;
    },

    function(node, next) {
      enterChild();

      const {name, argName} = node;

      onArgumentTypeChanged(argName, getFunctionArgumentType(name));
      onRuntimeMethodUsed(RuntimeMethod.FUNCTION);

      src += RuntimeMethod.FUNCTION + `(${JSON.stringify(renameFunction(name))},${getArgumentVarName(argName)}`;
      compileFragment(node, next);
      src += ')';
    },

    plural(node) {
      enterChild();
      src += compilePlural(node, RuntimeMethod.PLURAL, options);
    },

    selectOrdinal(node) {
      enterChild();
      src += compilePlural(node, RuntimeMethod.SELECT_ORDINAL, options);
    },

    select(node) {
      const {argName, children} = node;
      const keySrcs: Array<string> = [];

      onArgumentTypeChanged(argName, ORDINAL_ARG_TYPE);

      let childrenSrc = '';
      let j = 0;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const keySrc = JSON.stringify(child.key);

        if (keySrcs.indexOf(keySrc) !== -1 || isBlankNode(child)) {
          continue;
        }
        if (j !== 0) {
          childrenSrc += ':' + TEMP_VAR_NAME;
        }
        childrenSrc += `===${i}?` + compileNode(child, options);
        keySrcs.push(keySrc);
        j++;
      }
      if (j === 0) {
        return;
      }
      enterChild();
      if (j !== 1) {
        src += `(${TEMP_VAR_NAME}=`;
      }

      onRuntimeMethodUsed(RuntimeMethod.SELECT);

      src += RuntimeMethod.SELECT + `(${getArgumentVarName(argName)},${keySrcs.join(',')})`;

      const defaultValueSrc = compileDefaultValue(nullable);
      src += j === 1 ? childrenSrc + ':' + defaultValueSrc : `,${TEMP_VAR_NAME}${childrenSrc}:${defaultValueSrc})`;
    },

    octothorpe(node) {
      let selectNode = node.parent;

      while (selectNode != null && !isSelectNode(selectNode)) {
        selectNode = selectNode.parent;
      }

      if (selectNode) {
        enterChild();
        src += selectNode.argName;
      } else {
        dieAtOffset(node.start);
      }
    },
  });

  return src;
}

function compilePlural(node: ISelectNode, runtimeMethod: RuntimeMethod, options: INodeCompilerOptions): string {
  const {
    nullable,
    getArgumentVarName,
    onArgumentTypeChanged,
    onRuntimeMethodUsed,
  } = options;

  const {argName, children} = node;

  onArgumentTypeChanged(argName, ORDINAL_ARG_TYPE);

  let otherNode: ISelectCaseNode | undefined;
  let childrenSrc = '';
  let j = 0;

  for (let i = 0; i < pluralCategories.length; i++) {
    for (const child of children) {
      if (child.key !== pluralCategories[i] || isBlankNode(child)) {
        continue;
      }
      if (child.key === PluralCategory.OTHER) {
        otherNode = child;
        continue;
      }
      if (j !== 0) {
        childrenSrc += ':' + TEMP_VAR_NAME;
      }
      childrenSrc += `===${i}?` + compileNode(child, options);
      j++;
    }
  }

  let src = '';
  if (j === 0) {
    return otherNode ? compileNode(otherNode, options) : src;
  }
  if (j !== 1) {
    src += `(${TEMP_VAR_NAME}=`;
  }

  onRuntimeMethodUsed(runtimeMethod);

  src += runtimeMethod + `(${getArgumentVarName(argName)})`;

  let otherSrc = otherNode ? compileNode(otherNode, options) : compileDefaultValue(nullable);

  src += j === 1 ? childrenSrc + ':' + otherSrc : `,${TEMP_VAR_NAME}${childrenSrc}:${otherSrc})`;
  return src;
}

export function compileDefaultValue(nullable: boolean): string {
  return nullable ? 'null' : '""';
}
