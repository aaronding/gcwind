import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'data/clubs.json']
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart']
    }
  },
  {
    files: [
      'tools/**/*.js',
      'tests/**/*.js',
      'eslint.config.js',
      'playwright.config.js',
      'vitest.config.js'
    ],
    languageOptions: {
      globals: globals.node
    }
  }
];
