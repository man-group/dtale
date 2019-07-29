/* eslint-disable no-restricted-globals */

const assign = require("lodash/assign");
const webpack = require("webpack");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const _ = require("lodash");
const baseConfig = require("./webpack.config.js");

function createConfig(subConfig) {
  return assign({}, subConfig, {
    mode: "production",
    devtool: "source-map",
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          uglifyOptions: {
            compress: {
              warnings: false,
            },
          },
        }),
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: '"production"',
        },
      }),
    ],
  });
}

module.exports = _.map(baseConfig, createConfig);
