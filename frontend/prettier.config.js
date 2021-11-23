module.exports = {
  printWidth: 120,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  bracketSpacing: true,
  arrowParens: 'always',
  parser: 'typescript',
  overrides: [
    {
      files: '*.css',
      options: {
        parser: 'css',
        singleQuote: true,
      },
    },
  ],
};
