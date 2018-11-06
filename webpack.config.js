const path = require('path');

module.exports = {
  entry: {
    'map': ['./ts/map/MapComponent.ts', './ts/map/index.ts'],
    'route': ['./ts/map/MapComponent.ts', './ts/route/index.ts'],
    'settings':  ['./ts/settings/settings.ts']
  }, 
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: '[name]-bundle.js',
    path: path.resolve(__dirname, 'public/bundle')
  }
};