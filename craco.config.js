const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        fs: false,
        https: false,
        http: false,
        url: false,
        stream: false,
        zlib: false,
        path: false,
        crypto: false,
        buffer: false,
        util: false,
        events: false,
        net: false,
        tls: false,
        os: false,
      };
      webpackConfig.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        })
      );
      return webpackConfig;
    },
  },
};
