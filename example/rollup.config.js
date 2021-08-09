import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import html from '@rollup/plugin-html';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const plugins = [
  commonjs(),
  nodeResolve(),
  typescript(),
  html({
    title: 'MFML example',
  }),
  replace({
    preventAssignment: true,
    values: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  }),
];

if (process.env.NODE_ENV !== 'production') {
  plugins.push(
      serve('./target'),
      livereload(),
  );
}

export default {
  input: './src/index.tsx',
  preserveEntrySignatures: false,
  output: {
    dir: './target',
    format: 'es',
  },
  plugins,
};
