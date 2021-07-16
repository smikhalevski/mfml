// import {IMessageGroups} from './compileModuleGroups';
// import {createMap} from '../misc';
// import {createMfmlParser} from '../parser/createMfmlParser';
//
// export interface IMessageGroupsParserOptions {
//   splitTranslationKey: (key: string) => [groupKey: string, messageKey: string];
// }
//
// export function parseMessageGroups(translationsByLocale: { [locale: string]: { [translationKey: string]: string } }, options: IMessageGroupsParserOptions): IMessageGroups {
//   const {splitTranslationKey} = options;
//
//   const messageGroups: IMessageGroups = createMap();
//   const parseMfml = createMfmlParser();
//
//   for (const [locale, translations] of Object.entries(translationsByLocale)) {
//     for (const [key, translation] of Object.entries(translations)) {
//       const [groupKey, messageKey] = splitTranslationKey(key);
//       ((messageGroups[groupKey] ||= createMap())[messageKey] ||= createMap())[locale] = parseMfml(translation);
//     }
//   }
//
//   return messageGroups;
// }
