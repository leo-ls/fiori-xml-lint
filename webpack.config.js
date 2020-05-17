//@ts-check
'use strict';

const
    webpack = require('webpack'),
    path = require('path');

/**@type {webpack.ConfigurationFactory}*/
const config = function () {
    return {
        target: 'node',
        entry: './src/extension.ts',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'extension.js',
            libraryTarget: "commonjs2",
            devtoolModuleFilenameTemplate: "../[resource-path]",
        },
        devtool: 'source-map',
        externals: [
            {
                vscode: "commonjs vscode"
            },
            /^@sap/
        ],
        resolve: {
            extensions: ['.ts', '.js']
        },
        module: {
            rules: [{
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        compilerOptions: {
                            "module": "es6"
                        }
                    }
                }]
            }]
        }
    };
};
module.exports = config;