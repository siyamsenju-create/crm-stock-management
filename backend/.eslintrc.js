module.exports = {
  env: { node: true, es2021: true, jest: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 2021, sourceType: 'commonjs' },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_|next' }],
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
