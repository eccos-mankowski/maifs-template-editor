const path = require('path');
const { DefinePlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { WebpackPluginServe } = require('webpack-plugin-serve');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isProduction = process.env.NODE_ENV === 'production';
const analyzeBundle = process.env.WEBPACK_ANALYZE === 'yes';
const watch = process.env.WATCH === 'yes';
const outputPath = path.join(__dirname, 'dist');

const getStyleLoaders = (modules) => [
  { loader: 'style-loader' },
  {
    loader: 'css-loader',
    options: { modules },
  },
  { loader: 'sass-loader' },
  {
    loader: 'postcss-loader',
    options: {
      postcssOptions: {
        plugins: [
          require('postcss-flexbugs-fixes'),
          require('postcss-preset-env')({
            autoprefixer: {
              flexbox: 'no-2009',
            },
            stage: 3,
          }),
          require('postcss-normalize'),
        ],
      },
    },
  },
];

module.exports = {
  watch,
  mode: isProduction ? 'production' : 'development',
  entry: {
    main: [
      ...(isProduction ? [] : ['webpack-plugin-serve/client']),
      './src/index',
    ],
  },
  devtool: isProduction ? undefined : 'inline-source-map',
  output: {
    filename: 'ticket-editor.js',
    path: outputPath,
    publicPath:
      '/wp-content/plugins/eccospro-reserve/assets/admin/ticket-editor/dist/',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  optimization: {
    splitChunks: false,
    usedExports: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: path.join(__dirname, 'src'),
        exclude: /node_modules/,
        use: [
          ...(isProduction
            ? []
            : [
                {
                  loader: 'babel-loader',
                  options: {
                    plugins: ['react-refresh/babel'],
                  },
                },
              ]),
          {
            loader: 'ts-loader',
            options: { transpileOnly: true },
          },
        ],
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
              plugins: [...(isProduction ? [] : ['react-refresh/babel'])],
            },
          },
        ],
      },
      {
        test: /\.s?[ac]ss$/,
        exclude: /\.module\.s?[ac]ss$/,
        use: getStyleLoaders(false),
        sideEffects: true,
      },
      {
        test: /\.module\.s?[ac]ss$/,
        use: getStyleLoaders(true),
        sideEffects: true,
      },
      {
        test: /\.(woff|woff2)$/,
        use: {
          loader: 'url-loader',
          options: {
            name: 'fonts/[hash].[ext]',
            limit: 5000,
            mimetype: 'application/font-woff',
          },
        },
      },
      {
        test: /\.(ttf|eot|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[hash].[ext]',
          },
        },
      },
    ],
  },
  plugins: [
    new DefinePlugin({
      'process.env': '{}',
    }),
    ...(analyzeBundle ? [new BundleAnalyzerPlugin()] : []),
    ...(isProduction
      ? []
      : [
          new WebpackPluginServe({
            static: outputPath,
            status: false,
            host: '127.0.0.1',
            port: 16821,
          }),
          new ReactRefreshPlugin({
            overlay: {
              sockIntegration: 'wps',
            },
          }),
        ]),
    new ForkTsCheckerWebpackPlugin(),
    new CleanWebpackPlugin(),
  ],
};
