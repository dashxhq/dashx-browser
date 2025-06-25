import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'

export default [
  {
    ignores: ['dist', 'eslint.config.js', 'codegen.ts'],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        browser: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      import: importPlugin,
    },
    rules: {
      'semi': ['error', 'never'],
      'array-bracket-spacing': ['error', 'always'],
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'object-curly-newline': ['error', { consistent: true }],
      quotes: ['error', 'single'],
    },
  },
]
