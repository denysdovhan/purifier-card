/*  eslint-env node */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import image from '@rollup/plugin-image';
import postcss from 'rollup-plugin-postcss';
import postcssPresetEnv from 'postcss-preset-env';
import postcssLit from 'rollup-plugin-postcss-lit';
import terser from '@rollup/plugin-terser';
import minifyLiterals from 'rollup-plugin-minify-html-literals-v3';
import replace from '@rollup/plugin-replace';
import serve from 'rollup-plugin-serve';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const licenseBanner = [
  './LICENSE',
  './node_modules/@thomasloven/round-slider/LICENSE.txt',
  './node_modules/lit/LICENSE',
]
  .map((file) => `/*!\n${readFileSync(file, 'utf8')}\n*/`)
  .join('\n');

const IS_DEV = process.env.ROLLUP_WATCH;

const serverOptions = {
  contentBase: ['./dist'],
  host: 'localhost',
  port: 5000,
  allowCrossOrigin: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
};

const plugins = [
  nodeResolve(),
  // Keep the bundled slider independent of HA and other custom cards.
  // This package registers its element unconditionally, so use a private name.
  replace({
    include: '**/node_modules/@thomasloven/round-slider/round-slider.js',
    values: {
      'customElements.define("round-slider", RoundSlider);':
        'customElements.define("purifier-round-slider", RoundSlider);',
    },
    preventAssignment: true,
  }),
  commonjs(),
  json(),
  replace({
    values: {
      PKG_VERSION_VALUE: IS_DEV ? 'DEVELOPMENT' : pkg.version,
    },
    preventAssignment: true,
  }),
  postcss({
    plugins: [
      postcssPresetEnv({
        stage: 1,
        features: {
          'nesting-rules': true,
        },
      }),
    ],
    extract: false,
  }),
  postcssLit(),
  image(),
  typescript(),
  babel({
    babelHelpers: 'runtime',
    exclude: 'node_modules/**',
  }),
  IS_DEV && serve(serverOptions),
  // Preserve self-closing SVG paths in the bundled slider's templates.
  !IS_DEV &&
    minifyLiterals({
      exclude: '**/node_modules/@thomasloven/round-slider/**',
    }),
  !IS_DEV &&
    terser({
      maxWorkers: 1,
      output: {
        comments: false,
      },
    }),
].filter(Boolean);

export default {
  input: 'src/purifier-card.ts',
  output: {
    dir: 'dist',
    banner: licenseBanner,
    format: 'es',
    inlineDynamicImports: true,
  },
  context: 'window',
  plugins,
};
