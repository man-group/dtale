/* eslint-disable no-restricted-globals */

const assign = require("lodash/assign");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const _ = require("lodash");
const baseConfig = require("./webpack.config.js");

function createConfig(subConfig) {
  return assign({}, subConfig, {
    mode: "production",
    devtool: "source-map",
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
        "process.env": {
          NODE_ENV: JSON.stringify("production"),
        },
      }),
    ],
  });
}

function createDashConfig(subConfig) {
  return assign({}, subConfig, {
    mode: "production",
  });
}

module.exports = _.concat(
  _.map(
    _.filter(baseConfig, c => !_.endsWith(c.output.path, "dtale/static/dash")),
    createConfig
  ),
  _.map(
    _.filter(baseConfig, c => _.endsWith(c.output.path, "dtale/static/dash")),
    createDashConfig
  )
);
