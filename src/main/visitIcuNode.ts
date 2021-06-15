// import {Content, FunctionArg, PlainArg, Select} from '@messageformat/parser';
//
// export interface IIcuNodeVisitor {
//   onArgument: (node: PlainArg) => void;
//   onContent: (node: Content) => void;
//   onFunction: (node: Function) => void;
//   onPlural: (node: Select) => void;
//   onSelect: (node: Select) => void;
//   onSelectOrdinal: (node: Select) => void;
// }
//
// export function visitIcuNode(node: Content | PlainArg | FunctionArg | Select, visitor: IIcuNodeVisitor): void {
//   switch (node.type) {
//
//     case 'argument':
//       visitor.onArgument();
//       break;
//
//     case 'content':
//       visitor.onContent();
//       break;
//
//     case 'function':
//       visitor.onFunction();
//       break;
//
//     case 'plural':
//       visitor.onPlural();
//       break;
//
//     case 'select':
//       visitor.onSelect();
//       break;
//
//     case 'selectordinal':
//       visitor.onSelectOrdinal();
//       break;
//   }
// }
