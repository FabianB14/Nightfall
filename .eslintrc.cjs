module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  settings: { react: { version: '18.3' } },
  ignorePatterns: ['dist', 'node_modules', '*.config.js', '*.config.ts', '.eslintrc.cjs'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // The engine must never import from the UI or browser-only modules (§3 hard rule).
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['*/ui/*', '@ui/*', 'react', 'react-dom', 'howler', 'framer-motion'], message: 'engine/data must stay pure — no UI/browser imports.' },
      ],
    }],
  },
  overrides: [
    {
      // The import restriction only applies to the pure layers.
      files: ['src/ui/**', 'src/audio/**', 'src/*.tsx', 'src/main.tsx', 'src/store.ts', 'src/assets.ts'],
      rules: { 'no-restricted-imports': 'off' },
    },
  ],
};
