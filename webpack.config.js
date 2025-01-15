const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from .env file
const env = dotenv.config().parsed || {};

// Create a default environment with at least the required variables
const defaultEnv = {
    REACT_APP_GRAPHQL_ENDPOINT: 'http://localhost:5000/graphql',
    ...env
};

module.exports = {
    mode: 'production',
    entry: './src/renderer/index.tsx',
    target: 'web',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'postcss-loader'
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, 'dist/web'),
        clean: true,
        publicPath: '/'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'src/renderer/index.html'),
            filename: 'index.html'
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(defaultEnv)
        })
    ],
};