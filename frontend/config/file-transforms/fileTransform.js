// @ts-check

const path = require('path');

/**
 * Transformer for transforming 'files'. In the context of this library, this is for the purpose of non-TypeScript files
 * @type {{process(sourceText: string, sourcePath: string, options: Object): Object}}
 */
module.exports = {
  /**
   * Method for telling Jest how to process non-TS, non-CSS files
   * @param {string} sourceText the file's contents
   * @param {string} sourcePath the name of the file
   * @param {Object} options any configuration options
   * @return {Object} an ES5 compliant module string
   */
  process(sourceText, sourcePath, options) {
    return { code: `module.exports = ${JSON.stringify(path.basename(sourcePath))};` };
  },
};
