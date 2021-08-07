import {IConfig} from '../cli-types';
import marked from 'marked';

const config: IConfig = {
  presets: ['html'],
  rewriteTranslation: (translation) => marked(translation),
};

export default config;
