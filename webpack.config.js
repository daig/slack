const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Explicitly specify the path to your .env file
const env = dotenv.config({
    path: path.resolve(__dirname, '.env')
}).parsed || {};

// Create a default environment with at least the required variables
const defaultEnv = {
    REACT_APP_GRAPHQL_ENDPOINT:  'http://16.16.64.114:5000/graphql', // 'http://localhost:5001/graphql',
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
            'process.env': {
                // Each environment variable needs to be explicitly stringified
                REACT_APP_GRAPHQL_ENDPOINT: JSON.stringify(
                    env.REACT_APP_GRAPHQL_ENDPOINT || 'http://localhost:5002/graphql'
                )
            }
        })
    ],
};