const path = require('path');
const express = require('express');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const outputPath = path.resolve(__dirname, '../data/html/');
const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: {
    app: './src/index.jsx'
  },
  mode: isDevelopment ? 'development' : 'production',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          presets: [[
            '@babel/env',
            {
              'modules': false,
              'targets': '> 1%, last 3 versions, not dead'
            }
          ]],
          plugins: [isDevelopment && require.resolve('react-refresh/babel')].filter(Boolean),
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ]
  },
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime'
    },
    extensions: ['.*', '.js', '.jsx']
  },
  output: {
    path: outputPath,
    publicPath: '',
    filename: '[name].js'
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
    splitChunks: {
      cacheGroups: {
        muiVendor: {
          test: /[\\/]node_modules[\\/]@mui[\\/]/,
          name: 'vendor-mui',
          chunks: 'all',
        },
        chartjsVendor: {
          test: /[\\/]node_modules[\\/]chart\.js[\\/]/,
          name: 'vendor-chartjs',
          chunks: 'all',
        },
      },
    },
  },
  devServer: {
    static: {
      directory: outputPath,
    },
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.use('/mock/', express.static(path.resolve(__dirname, 'src/mock')));
      return middlewares;
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
