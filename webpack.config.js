const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = [{
	entry: './src/app/App.ts',
	output: {
		filename: './js/main.js',
		path: path.resolve(__dirname, 'build')
	},
	performance: {
		maxEntrypointSize: 8000000,
		maxAssetSize: 8000000
	},
	devtool: 'inline-source-map',
	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: './src/index.html',
			minify: false
		}),
		new MiniCssExtractPlugin({
			filename: 'style.css'
		}),
		new CopyPlugin({
			patterns: [
				{from: './src/resources/textures', to: path.resolve(__dirname, 'build/textures')},
				{from: './src/resources/models', to: path.resolve(__dirname, 'build/models')},
				{from: './src/resources/images', to: path.resolve(__dirname, 'build/images')}
			]
		}),
		new ESLintPlugin({
			context: './src',
			extensions: ['ts', 'tsx']
		})
	],
	module: {
		rules: [
			{
				test: /\.vert|.frag|.glsl$/i,
				use: [
					{
						loader: 'raw-loader',
						options: {
							esModule: false,
						},
					},
				]
			},
			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, 'css-loader']
			},
			{
				test: /\.worker\.ts$/,
				use: {loader: 'worker-loader'}
			},
			{
				test: /\.ts|.tsx$/,
				loader: 'ts-loader',
				options: {configFile: 'tsconfig.json'},
				exclude: /node_modules/
			}
		]
	},
	resolve: {
		extensions: ['.ts', '.js', '.tsx'],
		alias: {
			'~': path.resolve(__dirname, 'src')
		}
	}
}];
