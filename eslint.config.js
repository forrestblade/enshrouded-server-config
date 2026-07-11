// ESLint flat config — neostandard (JS Standard Style, TS-enabled) + Astro + Svelte.
// neostandard pins to ESLint 9; eslint-plugin-astro is held at v1 for that peer range.
//
// neostandard is scoped to JS/TS only so its parser + React rules never touch
// .astro/.svelte files — those are owned by their dedicated plugins (which also
// wire the correct TS-aware parsers for the component script blocks).
import neostandard from 'neostandard'
import astro from 'eslint-plugin-astro'
import svelte from 'eslint-plugin-svelte'

const JS_TS = ['**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}']

export default [
  {
    ignores: [
      'dist/',
      '.astro/',
      '.wrangler/',
      'node_modules/',
      'public/',
      'pnpm-lock.yaml',
      // .astro/.svelte correctness is owned by the Astro/Svelte compilers + astro check.
      // ESLint's TS parser for their <script> blocks needs a hoisted
      // @typescript-eslint/parser that this env doesn't expose. neostandard still
      // lints all .ts/.js logic (schema, entity, shared, widgets model).
      '**/*.astro',
      '**/*.svelte',
    ],
  },
  ...neostandard({ ts: true }).map((config) => ({ ...config, files: config.files ?? JS_TS })),
  ...astro.configs['flat/recommended'],
  ...svelte.configs['flat/recommended'],
]
