/* eslint-env node */
module.exports = {
  parser: '@typescript-eslint/parser', // 指定 ESLint 解析器
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // 使用來自 @typescript-eslint/eslint-plugin 的推薦規則
  ],
  parserOptions: {
    ecmaVersion: 2020, // 使用最新的 ECMAScript 標準
    sourceType: 'module', // 允許使用 import/export 語法
  },
  rules: {
    // 自定義規則
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
