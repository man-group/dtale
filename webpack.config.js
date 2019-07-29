/* eslint-disable no-restricted-globals */
const webpack = require("webpack");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const autoprefixer = require("autoprefixer");
const postcssNested = require("postcss-nested");
const _ = require("lodash");

const entries = [
  ["base_styles", "/static/base_styles.js"],
  ["polyfills", "/static/polyfills.js"],
  ["dtale", "/static/dtale/dtale_main.jsx"],
];

function createConfig(entry) {
  const entryName = entry[0];
  const entryPath = entry[1];
  return {
    devtool: "inline-source-map",
    mode: "development",
    entry: __dirname + entryPath,
    output: {
      path: __dirname + "/dtale/static/dist",
      filename: entryName + "_bundle.js",
      publicPath: "/dist/",
    },
    resolve: {
      extensions: [".js", ".jsx", ".css", ".scss"],
    },
    module: {
      rules: [
        {
          test: /.jsx?$/,
          loader: "babel-loader",
          exclude(file) {
            return file.startsWith(__dirname + "/node_modules");
          },
          query: {
            cacheDirectory: true,
            presets: ["@babel/env", "@babel/react", "@babel/flow"],
            plugins: ["@babel/plugin-proposal-class-properties"],
          },
        },
        {
          test: require.resolve("jquery"),
          use: [{ loader: "expose-loader", options: "jQuery" }, { loader: "expose-loader", options: "$" }],
        },
        {
          test: /\.css$/,
          use: [
            "style-loader",
            { loader: "css-loader", options: { importLoaders: 1 } },
            {
              loader: "postcss-loader",
              options: {
                plugins() {
                  return [postcssNested, autoprefixer];
                },
              },
            },
          ],
        },
        {
          test: /\.scss$/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          loader: "url-loader",
          options: { limit: 10000, mimetype: "image/svg+xml" },
        },
        {
          test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
          loader: "url-loader",
          options: { limit: 10000, mimetype: "application/font-woff" },
        },
        {
          test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
          loader: "url-loader",
          options: { limit: 10000, mimetype: "application/octet-stream" },
        },
        {
          test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
          loader: "url-loader",
          options: { limit: 10000, mimetype: "image/png" },
        },
        {
          test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
          loader: "file-loader",
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: '"dev"',
        },
      }),
      new CleanWebpackPlugin(["dtale/static/dist"], {
        verbose: false,
        exclude: [".git_keep"],
      }),
      new webpack.HotModuleReplacementPlugin(),
    ],
    externals: {
      window: "window",
      HTMLElement: "HTMLElement",
    },
    watchOptions: {
      poll: true,
    },
  };
}

module.exports = _.map(entries, createConfig);
