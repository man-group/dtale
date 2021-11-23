// @ts-check

/**
 * CSS transformation for Jest.
 *
 * @type ({getCacheKey(): string, process(): string}
 */
module.exports = {
  /**
   * Method for telling Jest how to process CSS files
   * @return {string} an ES5 compliant module string
   */
  process() {
    return 'module.exports = {};';
  },

  /**
   * Method for producing a cache key for this transformer
   * @return {string} the cache key
   */
  getCacheKey() {
    // The output of invoking 'process()' is always the same.
    return 'cssTransform';
  },
};
