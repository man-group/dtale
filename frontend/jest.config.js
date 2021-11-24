// @ts-check

const fs = require('fs');
const path = require('path');

// polyfills meust be resolved relative to this project's directory structure
const testPolyfills = require.resolve('./config/testPolyfills');

// the path of `tsconfig.test.json` must be resolved relative to the project consuming this library
const testTsConfig = path.resolve(fs.realpathSync(process.cwd()), 'tsconfig.test.json');

module.exports = {
  collectCoverageFrom: ['<rootDir>/static/**/*.{js,ts}?(x)'],
  coverageDirectory: './JS_coverage',
  coveragePathIgnorePatterns: ['<rootDir>/static/__tests__/', '<rootDir>/static/dash/lib/custom.js'],
  coverageReporters: ['html', 'lcovonly', 'text-summary'],
  globals: {
    'ts-jest': {
      tsConfig: testTsConfig,
    },
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/config/styleMock.js',
  },
  setupFiles: [testPolyfills],
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  testMatch: [
    '<rootDir>/static/**/__tests__/**/*-test.{js,ts}?(x)',
    '<rootDir>/static/**/?(*.)(spec|test).{js, ts}?(x)',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  testEnvironment: 'jsdom',
  testURL: 'http://localhost',
  testTimeout: 30000,
  transform: {
    '^.+\\.(ts|js)x?$': require.resolve('ts-jest'),
    '^.+\\.(js|jsx)$': require.resolve('babel-jest'),
    '^.+\\.css$': require.resolve('./config/file-transforms/cssTransform.js'),
    '^(?!.*\\.(css|json)$)': require.resolve('./config/file-transforms/fileTransform.js'),
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$'],
};
