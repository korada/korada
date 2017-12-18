const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpackDevServer= require('webpack-dev-server');
const webpack = require('webpack');
const HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
  template: './index.html',
  filename: 'index.html',
  inject: 'body'
});

module.exports = {
  entry: './index.js',
  devServer:{
    historyApiFallback:true
    
  },
  output: {
    path: path.resolve('dist'),
    filename: 'index_bundle.js'
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ }
    ]
  },
  plugins:[HtmlWebpackPluginConfig,
    new webpack.DefinePlugin({
        'process.env':{
            'NODE_ENV': JSON.stringify('production')
        }
    })]
}