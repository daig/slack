const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './landing-page/index.js',  // You can create this as an empty file for now
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'landing.[contenthash].js',
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './landing-page/public/index.html',
      filename: 'index.html'
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: "landing-page/public",
          to: "",
          globOptions: {
            ignore: ["**/index.html"]
          }
        }
      ],
    }),
  ]
}; 