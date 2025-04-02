#!/usr/bin/env node

// @ts-check

const jest = require('jest');
const path = require('path');
const resolve = require('resolve');

process.env.NODE_ENV = 'test';

// Makes the script crash on unhandled rejections instead of silently ignoring them.
process.on('unhandledRejection', (err) => {
  if (err instanceof Error) {
    throw err;
  } else if (typeof err === 'string') {
    throw Error(err);
  } else if (err && 'toString' in err) {
    throw Error(err.toString());
  }
  throw Error('an unhandledRejection event occurred that could not be serialized');
});

/** @type {string[]} */
const argv = process.argv.slice(2);

// Watch unless on CI or in coverage mode
if (!process.env.CI && argv.indexOf('--coverage') < 0) {
  argv.push('--watch');
}

/**
 * This is a very dirty workaround for https://github.com/facebook/jest/issues/5913. We're trying to resolve the
 * environment ourselves because Jest does it incorrectly; Jest bases its resolution of environment on the root
 * directory of the project, rather than the Jest package itself.
 * @param {string} name the name of the environment to resolve.
 * @return {string} the path of the jest environment
 * @throws is a resolution for a necessary directory fails
 */
function resolveJestDefaultEnvironment(name) {
  const jestDir = path.dirname(resolve.sync('jest', { basedir: __dirname }));
  const jestCLIDir = path.dirname(resolve.sync('jest-cli', { basedir: jestDir }));
  const jestConfigDir = path.dirname(resolve.sync('jest-config', { basedir: jestCLIDir }));
  return resolve.sync(name, { basedir: jestConfigDir });
}

/** @type {string[]} */
const cleanArgv = [];
/** @type {string | undefined} */
const defaultEnv = 'jsdom';
/** @type {string | undefined} */
let parsedEnv = defaultEnv;
/** @type {string | undefined} */
let nextArgument;

// Parse the arugments provided to see if the user attempted to override the environment
const envParam = '--env';
do {
  nextArgument = argv.shift();
  if (!nextArgument) {
    break;
  }

  if (nextArgument === envParam) {
    parsedEnv = argv.shift();
  } else if (nextArgument.indexOf(envParam) === 0) {
    parsedEnv = nextArgument.substring(envParam.length);
  } else {
    cleanArgv.push(nextArgument);
  }
} while (argv.length > 0);
// If the environment resolved is undefined by some parse of user error, use the defaults.
parsedEnv = parsedEnv || defaultEnv;

/** @type {string | undefined} */
let resolvedEnv;

try {
  resolvedEnv = resolveJestDefaultEnvironment(`jest-environment-${parsedEnv}`);
} catch {
  // ignore, this is possible if not using an environment with the prefix 'jest-environment-'
}
if (!resolvedEnv) {
  try {
    resolvedEnv = resolveJestDefaultEnvironment(parsedEnv);
  } catch {
    // ignore, we'll save the error message for the diagnostic below
  }
}
const testEnvironment = resolvedEnv || parsedEnv;
if (!testEnvironment) {
  throw new Error(`Unable to determine a test environment from ${argv.toString()}.
    - The parsed environment was '${parsedEnv}'
    - The resolved environment was '${resolvedEnv}'`);
}

/* eslint-disable-next-line no-console */
console.log(`Using test environment: ${testEnvironment}`);
argv.push(envParam, testEnvironment);
jest.run(cleanArgv);
