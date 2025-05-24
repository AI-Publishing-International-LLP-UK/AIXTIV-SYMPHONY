module.exports = {
  env: {
    node: true,
    es2021: true,
    'jest/globals': true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'commonjs',
  },
  plugins: ['jest', 'promise'],
  rules: {
    'promise/always-return': 'error',
    'promise/no-return-wrap': 'error',
    'promise/param-names': 'error',
    'promise/catch-or-return': 'error',
    'promise/no-nesting': 'warn',
    'promise/no-promise-in-callback': 'warn',
    'promise/no-callback-in-promise': 'warn',
    'promise/no-new-statics': 'error',
    'promise/valid-params': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'require-await': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
    },
  ],
};
