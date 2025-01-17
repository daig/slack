const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');
const CopyPlugin = require('copy-webpack-plugin');

const env = dotenv.config({
    path: path.resolve(__dirname, '.env')
}).parsed || {};

const defaultEnv = {
    REACT_APP_GRAPHQL_ENDPOINT: 'http://13.49.69.231:5000/graphql',
    ELEVENLABS_API_KEY: env.ELEVENLABS_API_KEY,
    REACT_APP_CLOUDINARY_CLOUD_NAME: env.REACT_APP_CLOUDINARY_CLOUD_NAME,
    REACT_APP_CLOUDINARY_UPLOAD_PRESET: env.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
    ...env
};

module.exports = [
    // Main app config
    {
        name: 'main',
        mode: 'production',
        entry: './src/renderer/index.tsx',
        target: 'web',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader', 'postcss-loader'],
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
                    REACT_APP_GRAPHQL_ENDPOINT: JSON.stringify(
                        env.REACT_APP_GRAPHQL_ENDPOINT || 'http://localhost:5001/graphql'
                    ),
                    ELEVENLABS_API_KEY: JSON.stringify(env.ELEVENLABS_API_KEY),
                    REACT_APP_CLOUDINARY_CLOUD_NAME: JSON.stringify(env.REACT_APP_CLOUDINARY_CLOUD_NAME),
                    REACT_APP_CLOUDINARY_UPLOAD_PRESET: JSON.stringify(env.REACT_APP_CLOUDINARY_UPLOAD_PRESET)
                }
            })
        ],
        optimization: {
            minimize: true,
            splitChunks: {
                chunks: 'all',
                maxInitialRequests: 10,
                minSize: 0
            }
        }
    }
];