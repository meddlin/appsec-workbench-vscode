import babelParser from '@babel/eslint-parser';
import js from '@eslint/js';

const commonLanguageOptions = {
  ecmaVersion: 'latest',
  sourceType: 'module'
};

const commonRules = {
  'no-undef': 'off',
  'no-unused-vars': 'off'
};

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ...commonLanguageOptions,
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          parserOpts: {
            plugins: ['typescript']
          }
        }
      }
    },
    rules: commonRules
  },
  {
    files: ['src/**/*.tsx'],
    languageOptions: {
      ...commonLanguageOptions,
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          parserOpts: {
            plugins: [['typescript', { isTSX: true }], 'jsx']
          }
        }
      }
    },
    rules: commonRules
  }
];
