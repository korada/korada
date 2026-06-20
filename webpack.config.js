const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    // Main resume/portfolio SPA → docs/index.html
    main: './client/index.jsx',
    // Seemantham RSVP page → docs/SravyaBabyShower/index.html
    babyshower: './client/babyshower.jsx'
  },
  devtool: 'eval-source-map',
  devServer: {
    historyApiFallback: true,
    hot: true,
    port: 3000,
    open: true
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
    publicPath: '/'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.(css|scss|sass)$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(png|gif|jpg|svg|woff|woff2|eot|ttf|ico)$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    // Main SPA: client/index.html + main bundle → index.html
    new HtmlWebpackPlugin({
      template: 'client/index.html',
      filename: 'index.html',
      chunks: ['main']
    }),
    // RSVP page: rendered from <BabyShower /> → SravyaBabyShower/index.html
    // Adding another standalone page is now just: add an entry above + a
    // matching HtmlWebpackPlugin here. No hand-written HTML to maintain.
    new HtmlWebpackPlugin({
      template: 'client/babyshower.html',
      filename: 'SravyaBabyShower/index.html',
      chunks: ['babyshower']
    })
  ]
};
