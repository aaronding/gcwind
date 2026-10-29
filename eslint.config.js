import js from '@eslint/js';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

// Svelte 5 runes are compiler-provided, not imports, so they have to be declared
// as globals for the .svelte.js modules that use them.
const runes = {
  $state: 'readonly',
  $derived: 'readonly',
  $effect: 'readonly',
  $props: 'readonly',
  $bindable: 'readonly',
  $inspect: 'readonly',
  $host: 'readonly'
};

export default [
  {
    ignores: ['node_modules/**', '_site/**', 'public/**', 'src/lib/clubs.json', 'test-results/**']
  },
  js.configs.recommended,
  ...svelte.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...runes, __APP_VERSION__: 'readonly' }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart']
    }
  },
  {
    // Built into sw.js, where the build fills in the __SW_*__ constants.
    files: ['src/sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        __SW_CACHE__: 'readonly',
        __SW_SHELL__: 'readonly',
        __SW_ART__: 'readonly'
      }
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      globals: { ...globals.browser, ...runes, __APP_VERSION__: 'readonly' }
    }
  },
  {
    files: [
      'tools/**/*.js',
      'tests/**/*.js',
      'eslint.config.js',
      'playwright.config.js',
      'vitest.config.js',
      'vite.config.js'
    ],
    languageOptions: {
      globals: globals.node
    }
  }
];
