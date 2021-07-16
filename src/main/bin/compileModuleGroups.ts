// import {compileModule, IMessageGroup, IModuleCompilerOptions} from '../compiler/compileModule';
// import {createMap, identity, jsonStringify} from '../misc';
// import {camelCase, pascalCase} from '../codegen';
//
// export interface IMessageGroups {
//   [groupKey: string]: IMessageGroup;
// }
//
// export interface IModuleGroupsCompilerOptions extends IModuleCompilerOptions {
//   renameMessageGroup: (key: string) => string;
// }
//
// /**
//  * Compiles a set of named message groups to a map from file name to a file source.
//  */
// export function compileModuleGroups(messageGroups: IMessageGroups, options: Partial<IModuleGroupsCompilerOptions> = {}): { [filePath: string]: string } {
//   const opts = Object.assign({}, moduleGroupsCompilerOptions, options);
//
//   const fileMap = createMap<string>();
//   const groupVarNames: Array<string> = [];
//
//   for (const [groupKey, messageGroup] of Object.entries(messageGroups)) {
//     const groupVarName = opts.renameMessageGroup(groupKey);
//     groupVarNames.push(groupVarName);
//
//     fileMap[groupVarName + '.ts'] = compileModule(messageGroup, opts);
//   }
//
//   fileMap['index.ts'] = groupVarNames.reduce((src, groupVarName) => src + `import*as ${groupVarName} from${jsonStringify('./' + groupVarName)};`, '')
//       + `export{${groupVarNames.join(',')}};`;
//
//   return fileMap;
// }
//
// export const moduleGroupsCompilerOptions: IModuleGroupsCompilerOptions = {
//   renameMessageGroup: pascalCase,
//   renameInterface: (key) => 'I' + pascalCase(key) + 'Args',
//   renameFunction: camelCase,
//   rewriteDisplayName: (key) => key,
//   renameArgument: camelCase,
//   defaultLocale: 'en',
//   renameTag: identity,
//   renameAttribute: identity,
//   renameFunction: identity,
//   nullable: false,
//   getFunctionArgumentType: () => undefined,
//   otherSelectCaseKey: 'other',
// };
