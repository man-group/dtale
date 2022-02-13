/* eslint-disable no-restricted-globals */
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const autoprefixer = require('autoprefixer');
const postcssNested = require('postcss-nested');
const path = require('path');
const paths = require('./config/paths');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const entries = [
  ['base_styles', './static/base_styles.js'],
  ['polyfills', './static/polyfills.js'],
  ['dtale', './static/main.tsx'],
  ['network', './static/network/main.tsx'],
];

function createConfig(entry) {
  const entryName = entry[0];
  const entryPath = entry[1];
  return {
    devtool: 'inline-source-map',
    mode: 'development',
    entry: path.resolve(__dirname, entryPath),
    output: {
      path: path.resolve(__dirname, '../dtale/static/dist'),
      filename: entryName + '_bundle.js',
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'],
      symlinks: false,
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          loader: 'babel-loader',
          exclude: [/node_modules/],
          options: {
            cacheDirectory: true,
            presets: [['@babel/env', { targets: ['last 2 versions'] }], '@babel/react', '@babel/flow'],
          },
        },
        {
          test: /\.(ts|tsx)$/,
          include: paths.appSrc,
          exclude: [/node_modules/],
          use: [
            {
              loader: require.resolve('ts-loader'),
              options: {
                transpileOnly: true,
                configFile: paths.appTsConfig,
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            { loader: 'css-loader', options: { importLoaders: 1 } },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [postcssNested, autoprefixer],
                },
              },
            },
          ],
        },
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10000,
            },
          },
          generator: {
            filename: '[name]-[contenthash:8][ext]',
          },
        },
        {
          test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10000,
            },
          },
          generator: {
            filename: '[name]-[contenthash:8][ext]',
          },
        },
        {
          test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10000,
            },
          },
          generator: {
            filename: '[name]-[contenthash:8][ext]',
          },
        },
        {
          test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10000,
            },
          },
          generator: {
            filename: '[name]-[contenthash:8][ext]',
          },
        },
        {
          test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('development'),
        },
      }),
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [entryName + '_bundle.js'],
        cleanAfterEveryBuildPatterns: [entryName + '_bundle.js'],
        verbose: true,
        exclude: ['.git_keep'],
      }),
      new webpack.HotModuleReplacementPlugin(),
    ],
    externals: {
      window: 'window',
      HTMLElement: 'HTMLElement',
    },
    watchOptions: {
      poll: true,
    },
  };
}

const dashEntries = [
  ['components', './static/dash/lib/index.js'],
  ['custom', './static/dash/lib/custom.js'],
];

function createDashConfig(entry) {
  const entryName = entry[0];
  const entryPath = entry[1];
  return {
    mode: 'development',
    entry: path.resolve(__dirname, entryPath),
    output: {
      path: path.resolve(__dirname, '../dtale/static/dash'),
      filename: entryName + '_bundle.js',
      library: entryName,
      libraryTarget: 'window',
    },
    devtool: 'source-map',
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      'plotly.js': 'Plotly',
      'prop-types': 'PropTypes',
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'],
      symlinks: false,
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          loader: 'babel-loader',
          exclude: [/node_modules/],
          options: {
            cacheDirectory: true,
            presets: [['@babel/env', { targets: ['last 2 versions'] }], '@babel/react', '@babel/flow'],
          },
        },
        {
          test: /\.(ts|tsx)$/,
          include: paths.appSrc,
          exclude: [/node_modules/],
          use: [
            {
              loader: require.resolve('ts-loader'),
              options: {
                transpileOnly: true,
                configFile: paths.appTsConfig,
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            { loader: 'css-loader', options: { importLoaders: 1 } },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [postcssNested, autoprefixer],
                },
              },
            },
          ],
        },
        {
          test: require.resolve('axios'),
          loader: 'expose-loader',
          options: {
            exposes: ['axios'],
          },
        },
      ],
    },
  };
}

module.exports = [...entries.map(createConfig), ...dashEntries.map(createDashConfig)];
