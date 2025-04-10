const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/wms-proxy',
    createProxyMiddleware({
      target: 'http://40.76.140.183',
      changeOrigin: true,
      pathRewrite: {
        '^/wms-proxy': ''
      }
    })
  );
};