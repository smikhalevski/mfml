import {htmlParserOptions} from 'tag-soup';
import {decodeHtml} from 'speedy-entities/lib/full';

export default {
  ...htmlParserOptions,

  decodeText: decodeHtml,
  decodeAttribute: decodeHtml,
};
