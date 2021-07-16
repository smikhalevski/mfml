import {Adapter} from './adapter-types';
import {IMessageGroup} from '../compiler';
import {createMap} from '../misc';
import path from 'path';

export interface IJsonAdapterOptions {
  parseTranslationKey: (translationKey: string) => [groupKey: string, messageKey: string];
}

export const jsonAdapter: Adapter<IJsonAdapterOptions> = (fileMap, parse, options) => {
  const {parseTranslationKey} = options;
  const messageGroupMap: Record<string, IMessageGroup> = createMap();

  for (const [filePath, json] of Object.entries(fileMap)) {

    const locale = path.basename(filePath).replace(/\.[^.]*$/, '');
    const translationMap: Record<string, string> = JSON.parse(json);

    for (const [translationKey, translation] of Object.entries(translationMap)) {

      const [groupKey, messageKey] = parseTranslationKey(translationKey);

      const message = (messageGroupMap[groupKey + '.ts'] ||= createMap())[messageKey] ||= {
        translationMap: createMap(),
        displayName: translationKey,
      };

      message.translationMap[locale] = parse(translation);
    }
  }

  return messageGroupMap;
};
