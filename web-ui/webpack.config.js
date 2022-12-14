const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const outputPath = path.resolve(__dirname, "../data/html/");
const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: "./src/index.jsx",
  mode: isDevelopment ? "development" : "production",
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/env"],
          plugins: [isDevelopment && require.resolve('react-refresh/babel')].filter(Boolean),
        }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ]
  },
  resolve: { extensions: ["*", ".js", ".jsx"] },
  output: {
    path: outputPath,
    publicPath: "",
    filename: "bundle.js",
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
  devServer: {
    static: {
      directory: outputPath,
    },
    port: 3000,
    hot: true,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public' }
      ]
    }),
    new ESLintPlugin(),
    isDevelopment && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
};
