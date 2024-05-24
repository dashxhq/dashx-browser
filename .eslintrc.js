module.exports = {
  env: {
    browser: true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
  ],
  ignorePatterns: [ 'dist', '.eslintrc.js', 'codegen.ts' ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/semi': [ 'error', 'never' ],
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'comma',
          requireLast: true,
        },
        singleline: {
          delimiter: 'comma',
          requireLast: false,
        },
      },
    ],
    'array-bracket-spacing': [ 'error', 'always' ],
    'import/no-extraneous-dependencies': [ 'error', { devDependencies: true } ],
    'object-curly-newline': [ 'error', { consistent: true } ],
    quotes: [ 'error', 'single' ],
  },
}
