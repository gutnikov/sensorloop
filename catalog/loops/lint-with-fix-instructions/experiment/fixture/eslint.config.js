// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // parse.ts reads untyped JSON and checks every field by hand.
    files: ['src/parse.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/cli.ts'],
    rules: {
      'no-restricted-syntax': ['error', { selector: "CallExpression[callee.object.name='console']", message: 'Unexpected console call.' }],
    },
  },
);
