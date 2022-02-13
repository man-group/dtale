/* eslint-disable no-restricted-globals */
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const baseConfig = require('./webpack.config.js');

function createConfig(subConfig) {
  return {
    ...subConfig,
    mode: 'production',
    devtool: 'source-map',
    optimization: {
      minimizer: [
        new TerserPlugin({
          parallel: false,
          terserOptions: {
            warnings: false,
          },
        }),
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production'),
        },
      }),
    ],
  };
}

function createDashConfig(subConfig) {
  return {
    ...subConfig,
    mode: 'production',
  };
}

module.exports = baseConfig.map((c) =>
  c.output.path.endsWith('dtale/static/dash') ? createDashConfig(c) : createConfig(c),
);
