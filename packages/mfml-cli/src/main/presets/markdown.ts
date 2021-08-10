import {IConfig} from '../cli-types';
import marked from 'marked';

const markdownConfig: IConfig = {
  presets: ['html'],
  rewriteTranslation: (translation) => marked(translation),
};

export default markdownConfig;
