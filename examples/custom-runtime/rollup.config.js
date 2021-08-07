import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import html from '@rollup/plugin-html';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const plugins = [
  nodeResolve(),
  typescript(),
  html(),
];

if (process.env.NODE_ENV !== 'production') {
  plugins.push(
      serve({
        contentBase: './target',
        open: true,
      }),
      livereload(),
  );
}

export default {
  input: './src/index.ts',
  output: {
    dir: './target',
    format: 'iife',
  },
  plugins,
};
