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
      };
      return webpackConfig;
    },
  },
};
