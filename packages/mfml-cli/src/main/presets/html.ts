import {htmlParserOptions} from 'tag-soup';
import {IConfig} from '../cli-types';
import {decodeHtml} from 'speedy-entities';

const htmlConfig: IConfig = {
  ...htmlParserOptions,
  decodeText: decodeHtml,
  decodeAttribute: decodeHtml,
};

export default htmlConfig;
