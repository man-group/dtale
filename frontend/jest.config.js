// @ts-check

const fs = require('fs');
const path = require('path');

// polyfills must be resolved relative to this project's directory structure
const testPolyfills = require.resolve('./config/testPolyfills');

// the path of `tsconfig.test.json` must be resolved relative to the project consuming this library
const testTsConfig = path.resolve(fs.realpathSync(process.cwd()), 'tsconfig.test.json');

module.exports = {
  collectCoverageFrom: [
    'static/**/*.{js,jsx,ts,tsx}',
    '!static/__tests__/',
    '!static/dash/lib/custom.js',
    '!static/**/*test.{js,jsx,ts,tsx}',
  ],
  coverageDirectory: './JS_coverage',
  coverageReporters: ['html', 'lcovonly', 'text-summary'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/config/styleMock.js',
    axios: '<rootDir>/node_modules/axios/dist/node/axios.cjs',
  },
  setupFiles: [testPolyfills],
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  testMatch: ['<rootDir>/static/**/*test.{js,ts}?(x)'],
  testPathIgnorePatterns: ['/node_modules/'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  testTimeout: 30000,
  transform: {
    '^.+\\.(ts|tsx)$': [require.resolve('ts-jest'), testTsConfig],
    '^.+\\.(js|jsx)$': require.resolve('babel-jest'),
    '^.+\\.css$': require.resolve('./config/file-transforms/cssTransform.js'),
    '^(?!.*\\.(css|json)$)': require.resolve('./config/file-transforms/fileTransform.js'),
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$'],
  preset: 'ts-jest/presets/js-with-babel',
};
