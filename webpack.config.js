var HtmlWebpackPlugin = require('html-webpack-plugin')
var CopyWebpackPlugin = require('copy-webpack-plugin')

var path = require('path');

module.exports = env => {
  var webpackSettings = {
    cache: true,
    mode: 'development',
    entry: ['./client/index.jsx'],
    optimization: {
      usedExports: true
    },
    devtool: 'eval',
    devServer: {
      historyApiFallback: true
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: '[name].[hash].js',
      publicPath: '/'
    },
    resolve: {
      extensions: ['.webpack.js', '.web.js', '.js', '.jsx']
    },
    module: {
      rules: [{
        test: /\.jsx$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: true,
          presets: ['react', 'es2015']
        }
      },
        {
          test: /\.(png|gif|jpg|woff|eot|ttf|svg|woff2|ico)$/i,
          use: 'file-loader?name=images/[name].[ext]'
        },
        {
          test: /\.(config)$/i,
          use: 'file-loader?name=[name].[ext]'
        },
        {
          test: /\.(css|scss|sass)$/i,
          use: [
            'style-loader',
            'css-loader',
            'sass-loader'
          ]
        }

      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'client/index.html',
        filename: 'index.html'
      })
    ]
  };
  return webpackSettings;
};
