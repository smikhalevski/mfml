import {Node, NodeType} from '../parser';
import {visitNode} from './visitNode';
import {RuntimeMethod} from '../runtime';
import {throwSyntaxError} from '../parser/throwSyntaxError';

const identity = <T>(arg: T): T => arg;

export interface INodeCompilerOptions {
  argsVarName?: string;
  localeVarName?: string;
  renameArgument?: (argName: string) => string;
  renameAttribute?: (attrName: string) => string;
  renameFunction?: (fnName: string) => string;
  getArgumentType?: (argName: string, fnName: string | null) => string | undefined;
}

/**
 * Compiles an AST node as a source code.
 *
 * @param node The node to compile.
 * @param usedMethods The set of runtime methods that were referenced while compilation.
 * @param argMap Mutable mapping from argument name to its type.
 * @param options Compilation options.
 */
export function compileNode(node: Node, argMap: Record<string, string | undefined>, usedMethods: Set<RuntimeMethod>, options: INodeCompilerOptions = {}): string {
  const {
    argsVarName = 'args',
    localeVarName = 'locale',
    renameArgument = identity,
    renameAttribute = identity,
    renameFunction = identity,
    getArgumentType = () => undefined,
  } = options;

  let source = '';

  visitNode(node, {

    onFragment(node, next) {
      usedMethods.add(RuntimeMethod.FRAGMENT);

      source += RuntimeMethod.FRAGMENT + '(';
      next();
      source = trimComma(source) + '),';
    },

    onElement(node, next) {
      usedMethods.add(RuntimeMethod.ELEMENT);

      source += `${RuntimeMethod.ELEMENT}(${JSON.stringify(node.tagName)},`;

      if (node.attrs.length === 0) {
        source += 'null,';
      } else {
        source += '{';

        for (let i = 0; i < node.attrs.length; i++) {
          const attr = node.attrs[i];
          const attrChildren = attr.children;

          source += renameAttribute(attr.name) + ':';

          if (attrChildren.length === 0) {
            source += 'true,';
            continue;
          }

          if (attrChildren.length === 1) {
            source += compileNode(attrChildren[0], argMap, usedMethods, options) + ',';
            continue;
          }

          if (attrChildren.length > 1) {
            usedMethods.add(RuntimeMethod.FRAGMENT);

            source += RuntimeMethod.FRAGMENT + '(';
            for (let j = 0; j < attrChildren.length; j++) {
              source += compileNode(attrChildren[j], argMap, usedMethods, options) + ',';
            }
            source = trimComma(source) + '),';
          }
        }

        source = trimComma(source) + '},';
      }

      next();
      source = trimComma(source) + '),';
    },

    onText(node) {
      source += JSON.stringify(node.value) + ',';
    },

    onArgument(node) {
      const argName = renameArgument(node.arg);
      argMap[argName] = getArgumentType(node.arg, null);

      source += `${argsVarName}.${argName},`;
    },

    onFunction(node, next) {
      usedMethods.add(RuntimeMethod.FUNCTION);

      const argName = renameArgument(node.arg);
      argMap[argName] = getArgumentType(node.arg, node.name);

      const fnName = renameFunction(node.name);

      source += `${RuntimeMethod.FUNCTION}(${JSON.stringify(fnName)},${argsVarName}.${argName},`;
      next();
      source = trimComma(source) + '),';
    },

    onPlural(node) {
      usedMethods.add(RuntimeMethod.PLURAL);

      const argName = renameArgument(node.arg);
      argMap[argName] = 'number';
      source += `${RuntimeMethod.PLURAL}(${localeVarName},${argsVarName}.${argName},${compileSelectCases(node.children, argMap, usedMethods, options)})`;
    },

    onSelect(node) {
      usedMethods.add(RuntimeMethod.SELECT);

      const argName = renameArgument(node.arg);
      argMap[argName] = 'string';
      source += `${RuntimeMethod.SELECT}(${argsVarName}.${argName},${compileSelectCases(node.children, argMap, usedMethods, options)})`;
    },

    onSelectOrdinal(node) {
      usedMethods.add(RuntimeMethod.SELECT_ORDINAL);

      const argName = renameArgument(node.arg);
      argMap[argName] = 'number';
      source += `${RuntimeMethod.SELECT_ORDINAL}(${argsVarName}.${argName},${compileSelectCases(node.children, argMap, usedMethods, options)})`;
    },

    onOctothorpe(node) {
      for (let parent = node.parent; parent != null; parent = parent.parent) {
        if (
            parent.nodeType === NodeType.PLURAL
            || parent.nodeType === NodeType.SELECT
            || parent.nodeType === NodeType.SELECT_ORDINAL
        ) {
          source += `${argsVarName}.${renameArgument(parent.arg)},`;
          return;
        }
      }
      throwSyntaxError(node.start);
    },
  });

  return trimComma(source);
}

function compileSelectCases(nodes: Array<Node>, argMap: Record<string, string | undefined>, usedMethods: Set<RuntimeMethod>, options: INodeCompilerOptions): string {
  let source = '{';

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.nodeType !== NodeType.SELECT_CASE) {
      throwSyntaxError(node.start);
    }
    const children = node.children;

    source += node.key + ':';

    if (node.children.length === 1) {
      source += compileNode(children[0], argMap, usedMethods, options) + ',';
      continue;
    }

    usedMethods.add(RuntimeMethod.FRAGMENT);

    source += RuntimeMethod.FRAGMENT + '(';
    for (let j = 0; j < children.length; j++) {
      source += compileNode(children[j], argMap, usedMethods, options) + ',';
    }
    source = trimComma(source) + '),';
  }
  return trimComma(source) + '}';
}

export function trimComma(source: string): string {
  return source.charAt(source.length - 1) === ',' ? source.slice(0, -1) : source;
}
