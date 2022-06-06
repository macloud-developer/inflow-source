const path = require('path');

module.exports = {
    entry: './src/inflow-source.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: ['babel-loader'],
                exclude: /node_modules/,
            }
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js',
    },
};
