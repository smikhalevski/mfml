import {Node, NodeType} from './ast-types';
import {visitAst} from './visitAst';
import {RuntimeFields} from './RuntimeFields';

export interface ICompileAstOptions {
  renameArgument: (arg: string) => string;
}

export function compileAst(node: Node, options: ICompileAstOptions): string {
  const {renameArgument} = options;

  let source = '';

  visitAst(node, {
    onFragment(node, next) {
      source += `runtime.${RuntimeFields.FRAGMENT}(`;
      next();
      source += '),';
    },
    onElement(node, next) {
      source += `runtime.${RuntimeFields.ELEMENT}(${JSON.stringify(node.tagName)},`;

      if (node.attrs.length !== 0) {
        source += '{';

        for (let i = 0; i < node.attrs.length; i++) {
          source += node.attrs[i].name + ':';

          const children = node.attrs[i].children;

          if (children.length > 1) {
            source += `runtime.${RuntimeFields.FRAGMENT}(`;
            for (let j = 0; j < children.length; j++) {
              source += compileAst(children[0], options) + ',';
            }
            source += '),';
          }
          if (children.length === 1) {
            source += compileAst(children[0], options) + ',';
          }
          if (children.length === 0) {
            source += 'true,';
          }
        }

        source += '},';
      }

      next();
      source += '),';
    },
    onText(node) {
      source += JSON.stringify(node.value) + ',';
    },
    onArgument(node) {
      source += `args.${renameArgument(node.arg)},`;
    },
    onFunction(node, next) {
      source += `runtime.${RuntimeFields.FUNCTION}(${JSON.stringify(node.name)},${node.arg},`;
      next();
      source += '),';
    },
    onPlural(node) {
      source += `runtime.${RuntimeFields.PLURAL}(locale,${node.arg},{`;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.nodeType === NodeType.SELECT_CASE) {
          source += child.key + ':' + compileAst(child, options);
        }
      }
      source += '}),';
    },
    onSelect(node) {
      source += `runtime.${RuntimeFields.SELECT}(${node.arg},{`;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.nodeType === NodeType.SELECT_CASE) {
          source += child.key + ':' + compileAst(child, options);
        }
      }
      source += '}),';
    },
    onSelectOrdinal(node) {
      source += `runtime.${RuntimeFields.SELECT_ORDINAL}(${node.arg},{`;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.nodeType === NodeType.SELECT_CASE) {
          source += child.key + ':' + compileAst(child, options);
        }
      }
      source += '}),';
    },
    onOctothorpe(node) {
      if (node.parent?.parent?.nodeType === NodeType.SELECT) {
        source += node.parent.parent.arg;
      }
    },
  });

  return source;
}
