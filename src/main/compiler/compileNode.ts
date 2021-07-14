import {ContainerNode, isBlankNode, ISelectCaseNode, ISelectNode, isSelectNode, ITextNode, Node} from '../parser';
import {visitNode} from './visitNode';
import {die} from '../misc';
import {pluralCategories, PluralCategory} from '../runtime/pluralCategories';
import {RuntimeMethod} from '../runtime';

export const enum KnownArgumentType {
  NUMBER = 'number',
}

export interface IRenameOptions {
  renameTag: (name: string) => string;
  renameAttribute: (name: string) => string;
  renameFunction: (name: string) => string;

  /**
   * Returns the type of an argument that a function accepts.
   */
  rewriteFunctionArgumentType: (name: string) => string | undefined;
}

export interface INodeCompilerOptions extends IRenameOptions {

  /**
   * Returns the name of the the variable that holds an argument value.
   */
  resolveArgumentVarName: (argName: string) => string;

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
    resolveArgumentVarName,
    rewriteFunctionArgumentType,
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

      src += JSON.stringify(renameAttribute(node.name)) + ':';

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
      src += resolveArgumentVarName(node.name);
    },

    function(node, next) {
      enterChild();

      const {name, argName} = node;

      onArgumentTypeChanged(argName, rewriteFunctionArgumentType(name));
      onRuntimeMethodUsed(RuntimeMethod.FUNCTION);

      src += RuntimeMethod.FUNCTION + `(${JSON.stringify(renameFunction(name))},${resolveArgumentVarName(argName)}`;
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

      onArgumentTypeChanged(argName, KnownArgumentType.NUMBER);

      let childrenSrc = '';
      let j = 0;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const keySrc = JSON.stringify(child.key);

        if (keySrcs.indexOf(keySrc) !== -1 || isBlankNode(child)) {
          continue;
        }
        if (j !== 0) {
          childrenSrc += ':i';
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
        src += '(i=';
      }

      onRuntimeMethodUsed(RuntimeMethod.SELECT);

      src += RuntimeMethod.SELECT + `(${resolveArgumentVarName(argName)},${keySrcs.join(',')})`;

      src += j === 1 ? childrenSrc + ':null' : `,i${childrenSrc}:null)`;
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
        die(node.start);
      }
    },
  });

  return src;
}

function compilePlural(node: ISelectNode, runtimeMethod: RuntimeMethod, options: INodeCompilerOptions): string {
  const {
    resolveArgumentVarName,
    onArgumentTypeChanged,
    onRuntimeMethodUsed,
  } = options;

  const {argName, children} = node;

  onArgumentTypeChanged(argName, KnownArgumentType.NUMBER);

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
        childrenSrc += ':i';
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
    src += '(i=';
  }

  onRuntimeMethodUsed(runtimeMethod);

  src += runtimeMethod + `(${resolveArgumentVarName(argName)})`;

  let otherSrc = otherNode ? compileNode(otherNode, options) : 'null';

  src += j === 1 ? childrenSrc + ':' + otherSrc : `,i${childrenSrc}:${otherSrc})`;
  return src;
}
