module.exports = {
  lintOnSave: false,
  configureWebpack: {
    performance: {
      hints: false
    }
  },
  chainWebpack: config => {
    config.plugins.delete('eslint');
  }
} 