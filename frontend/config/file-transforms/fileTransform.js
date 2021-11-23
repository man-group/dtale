// @ts-check

const path = require('path');

/**
 * Transformer for transforming 'files'. In the context of this library, this is for the purpose of non-TypeScript files
 * @type {{process(src: string, filename: string): string}}
 */
module.exports = {
  /**
   * Method for telling Jest how to process non-TS, non-CSS files
   * @param {string} src the file's contents
   * @param {string} filename the name of the file
   * @return {string} an ES5 compliant module string
   */
  process(_src, filename) {
    return `module.exports = ${JSON.stringify(path.basename(filename))};`;
  },
};
