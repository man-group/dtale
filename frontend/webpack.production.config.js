const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

const baseConfig = require('./webpack.config.js');

const createConfig = (subConfig) => {
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
};

const createDashConfig = (subConfig) => {
  return {
    ...subConfig,
    mode: 'production',
  };
};

module.exports = baseConfig.map((c) =>
  c.output.path.endsWith('dtale/static/dash') ? createDashConfig(c) : createConfig(c),
);
