import {htmlParserOptions} from 'tag-soup';
import {IConfig} from '../cli-types';
import {decodeHtml} from 'speedy-entities';

const config: IConfig = {
  ...htmlParserOptions,
  decodeText: decodeHtml,
  decodeAttribute: decodeHtml,
};

export default config;
