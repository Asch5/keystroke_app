import { defineConfig } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  // Ignore config files to prevent parsing errors
  // {
  //   ignores: [
  //     '*.config.js',
  //     '*.config.mjs',
  //     '*.config.ts',
  //     '.prettierrc.cjs',
  //     '.eslintrc.*',
  //     'postcss.config.mjs',
  //     'tailwind.config.ts',
  //     'vitest.config.ts',
  //     'next.config.mjs',
  //     '.next/**',
  //     'node_modules/**',
  //     'documentation/**',
  //     'bufferFolder/**',
  //     'tests/**',
  //     'scripts/**',
  //     'documentation/**',
  //     'bufferFolder/**',
  //     'tests/**',
  //     'scripts/**',
  //   ],
  // },
  // {
  //   extends: compat.extends(
  //     'next/core-web-vitals',
  //     'eslint:recommended',
  //     'plugin:@typescript-eslint/recommended',
  //     'plugin:@typescript-eslint/recommended-requiring-type-checking',
  //     'plugin:import/recommended',
  //     'plugin:import/typescript',
  //     'prettier', // Disable ESLint formatting rules that conflict with Prettier
  //   ),
  //   plugins: {
  //     '@typescript-eslint': typescriptEslint,
  //   },
  //   languageOptions: {
  //     parser: tsParser,
  //     ecmaVersion: 2022,
  //     sourceType: 'module',
  //     parserOptions: {
  //       project: './tsconfig.json',
  //     },
  //   },
  //   rules: {
  //     // ==========================================
  //     // CURSOR RULES COMPLIANCE: TypeScript & Type Safety (Rule 8)
  //     // ==========================================
  //     '@typescript-eslint/no-unused-vars': [
  //       'error',
  //       {
  //         argsIgnorePattern: '^_',
  //         varsIgnorePattern: '^_',
  //         destructuredArrayIgnorePattern: '^_',
  //         ignoreRestSiblings: true,
  //       },
  //     ],
  //     '@typescript-eslint/no-explicit-any': 'error',
  //     '@typescript-eslint/ban-ts-comment': 'error',
  //     '@typescript-eslint/no-non-null-assertion': 'warn', // Reduced from error
  //     '@typescript-eslint/explicit-module-boundary-types': 'off', // Too strict for this project
  //     '@typescript-eslint/prefer-as-const': 'error',
  //     '@typescript-eslint/prefer-nullish-coalescing': 'warn',
  //     '@typescript-eslint/prefer-optional-chain': 'warn',
  //     '@typescript-eslint/no-floating-promises': 'warn', // Reduced from error
  //     '@typescript-eslint/no-misused-promises': 'warn', // Reduced from error
  //     '@typescript-eslint/await-thenable': 'error',
  //     '@typescript-eslint/require-await': 'off', // Disabled - too many false positives
  //     '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
  //     '@typescript-eslint/no-unsafe-assignment': 'warn', // Reduced for flexibility
  //     '@typescript-eslint/no-unsafe-call': 'warn',
  //     '@typescript-eslint/no-unsafe-member-access': 'warn',
  //     '@typescript-eslint/no-unsafe-return': 'warn',
  //     // ==========================================
  //     // CURSOR RULES COMPLIANCE: React & Performance (Rules 3, 18, 21)
  //     // ==========================================
  //     'react-hooks/exhaustive-deps': 'warn', // Reduced from error
  //     'react/no-unescaped-entities': 'off',
  //     'react/jsx-key': 'error',
  //     'react/no-array-index-key': 'warn',
  //     'react-hooks/rules-of-hooks': 'error',
  //     // ==========================================
  //     // CURSOR RULES COMPLIANCE: Console.log Usage & Logging (Rule 9)
  //     // ==========================================
  //     'no-console': [
  //       'warn',
  //       {
  //         allow: ['warn', 'error'],
  //       },
  //     ],
  //     // ==========================================
  //     // CURSOR RULES COMPLIANCE: File Size & Complexity (Rule 18)
  //     // ==========================================
  //     'max-lines': [
  //       'warn',
  //       {
  //         max: 400,
  //         skipBlankLines: true,
  //         skipComments: true,
  //       },
  //     ],
  //     complexity: ['warn', { max: 10 }],
  //     // ==========================================
  //     // CURSOR RULES COMPLIANCE: Code Quality
  //     // ==========================================
  //     'prefer-const': 'error',
  //     'no-var': 'error',
  //     'no-duplicate-imports': 'error',
  //     'no-case-declarations': 'error',
  //     // ==========================================
  //     // CURSOR RULES COMPLIANCE: Next.js Best Practices & Font Optimization
  //     // ==========================================
  //     '@next/next/no-img-element': 'error',
  //     '@next/next/no-page-custom-font': 'warn',
  //     '@next/next/no-sync-scripts': 'error',
  //     '@next/next/no-css-tags': 'error',
  //     '@next/next/no-document-import-in-page': 'error',
  //     '@next/next/no-head-import-in-document': 'error',
  //     '@next/next/no-html-link-for-pages': 'error',
  //     '@next/next/no-typos': 'error',
  //     '@next/next/no-unwanted-polyfillio': 'error',
  //     // ==========================================
  //     // CURSOR RULES COMPLIANCE: Style Checking & Code Formatting
  //     // ==========================================
  //     // Import/Export organization
  //     'import/order': [
  //       'warn',
  //       {
  //         groups: [
  //           'builtin',
  //           'external',
  //           'internal',
  //           'parent',
  //           'sibling',
  //           'index',
  //         ],
  //         'newlines-between': 'never',
  //         alphabetize: {
  //           order: 'asc',
  //           caseInsensitive: true,
  //         },
  //       },
  //     ],
  //     'import/no-duplicates': 'error',
  //     'import/no-unresolved': 'off', // Disabled for Next.js path mapping
  //     // Naming conventions (Modern TypeScript - no "I" prefix)
  //     '@typescript-eslint/naming-convention': [
  //       'warn',
  //       {
  //         selector: 'variableLike',
  //         format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
  //         leadingUnderscore: 'allow',
  //       },
  //       {
  //         selector: 'typeLike',
  //         format: ['PascalCase'],
  //       },
  //       {
  //         selector: 'interface',
  //         format: ['PascalCase'],
  //         // Removed: prefix: ['I'] - Modern TypeScript doesn't use this
  //       },
  //     ],
  //     // Removed overly opinionated style rules - let Prettier handle formatting
  //     // Keep only essential spacing rules
  //     'no-trailing-spaces': 'warn',
  //     'no-multiple-empty-lines': ['warn', { max: 2 }],
  //   },
  // },
]);
