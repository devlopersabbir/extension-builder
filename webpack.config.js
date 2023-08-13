require('dotenv/config');

const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const workbox = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const stylesHandler = 'style-loader';
const version = require('./package.json').version;

const buildTarget = process.env.BUILD_TARGET || 'web';
const isProduction = process.env.NODE_ENV == 'production';
const isWeb = buildTarget === "web";

const config = {
  entry: {
    polyfills: './src/polyfills.ts',
    main: ["./src/global.css", "./src/main.tsx"],
    contentScript: "./src/contentScript/content.ts",
    backgroundScript: "./src/backgroundScript/background.ts"
  },
  output: {
    path: path.resolve(__dirname, "dist", buildTarget),
    publicPath: '/',
    filename: isWeb ? "[name].[contenthash:12].js" : "[name].js",
  },
  devServer: {
    open: true,
    host: 'localhost',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: `./target/${buildTarget}/index.html`,
    }),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: "target/shared",
        },
        {
          from: `target/${buildTarget}`,
          filter: (path) => !path.includes(`index.html`)
        }
      ]
    }),

    new webpack.DefinePlugin({
      BUILD_TARGET: JSON.stringify(buildTarget),
      DEV: JSON.stringify(!isProduction),
      VERSION: JSON.stringify(version)
    })
  ],


  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '...'],
  },
};

module.exports = () => {
  if (isProduction) {
    config.plugins.push(
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false,
      }),
    );
  }

  if (!isWeb) {
    config.plugins.push(
      new webpack.ProvidePlugin({
        browser: "webextension-polyfill"
      })
    )
  }

  if (isWeb && isProduction) {
    config.plugins.push(
      new workbox.GenerateSW({
        cacheId: 'extension-cache',
        dontCacheBustURLsMatching: /\.\w{12}\./,
      })
    );
  }
  return config;
};
