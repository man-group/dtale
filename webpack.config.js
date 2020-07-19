/* eslint-disable no-restricted-globals */
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const autoprefixer = require("autoprefixer");
const postcssNested = require("postcss-nested");
const _ = require("lodash");
const path = require("path");

const entries = [
  ["base_styles", "./static/base_styles.js"],
  ["polyfills", "./static/polyfills.js"],
  ["dtale", "./static/main.jsx"],
];

function createConfig(entry) {
  const entryName = entry[0];
  const entryPath = entry[1];
  return {
    devtool: "inline-source-map",
    mode: "development",
    entry: path.resolve(__dirname, entryPath),
    output: {
      path: path.resolve(__dirname, "./dtale/static/dist"),
      filename: entryName + "_bundle.js",
      //publicPath: "/dist/",
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
            // popsicle's code is not IE compliant so we need to run it through the babel plugins
            if (file.startsWith(__dirname + "/node_modules/@servie")) {
              return false;
            }
            if (file.startsWith(__dirname + "/node_modules/servie")) {
              return false;
            }
            if (file.startsWith(__dirname + "/node_modules/popsicle")) {
              return false;
            }
            if (file.startsWith(__dirname + "/node_modules/d3")) {
              return false;
            }
            if (file.startsWith(__dirname + "/node_modules/react-wordcloud")) {
              return false;
            }
            return file.startsWith(__dirname + "/node_modules");
          },
          query: {
            cacheDirectory: true,
            presets: ["@babel/env", "@babel/react", "@babel/flow"],
            plugins: ["@babel/plugin-proposal-class-properties", "@babel/plugin-transform-classes"],
          },
        },
        {
          test: require.resolve("jquery"),
          loader: "expose-loader",
          options: {
            exposes: ["$", "jQuery"],
          },
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
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [entryName + "_bundle.js"],
        cleanAfterEveryBuildPatterns: [entryName + "_bundle.js"],
        verbose: true,
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

const dashEntries = [
  ["components", "./static/dash/lib/index.js"],
  ["custom", "./static/dash/lib/custom.js"],
];

function createDashConfig(entry) {
  const entryName = entry[0];
  const entryPath = entry[1];
  return {
    mode: "development",
    entry: path.resolve(__dirname, entryPath),
    output: {
      path: path.resolve(__dirname, "./dtale/static/dash"),
      filename: entryName + "_bundle.js",
      //publicPath: "/dash/",
      library: entryName,
      libraryTarget: "window",
    },
    devtool: "source-map",
    externals: {
      react: "React",
      "react-dom": "ReactDOM",
      "plotly.js": "Plotly",
      "prop-types": "PropTypes",
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: "style-loader",
            },
            {
              loader: "css-loader",
            },
          ],
        },
        {
          test: require.resolve("jquery"),
          loader: "expose-loader",
          options: {
            exposes: ["$", "jQuery"],
          },
        },
      ],
    },
  };
}

module.exports = _.concat(_.map(entries, createConfig), _.map(dashEntries, createDashConfig));
