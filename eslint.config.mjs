// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['dist/**', 'coverage/**', 'playwright-report/**', 'node_modules/**'],
  },

  // Base JS recommended
  js.configs.recommended,

  // TypeScript strict + stylistic
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // React hooks
  {
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  // jsx-a11y
  {
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.configs.recommended.rules,
    },
  },

  // Project-wide settings
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Disallow any — no exceptions except explicit suppressions with reason
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // Prefer type-only imports for clarity
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // No unused vars (except _ prefix convention)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Keep switch exhaustive
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Prefer nullish coalescing over ||
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
    },
  },

  // Relax some rules in test files
  {
    files: ['**/*.test.{ts,tsx}', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },

  // Root config and Node scripts are outside browser tsconfig projectService
  {
    files: ['eslint.config.mjs', '*.config.ts', 'scripts/**/*.{js,mjs}'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: { ...globals.node, ...globals.es2022 },
      parserOptions: {
        projectService: false,
        project: false,
      },
    },
  },
);
