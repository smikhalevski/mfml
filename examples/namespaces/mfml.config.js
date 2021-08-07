var _ = require('lodash');

// Refer to https://smikhalevski.github.io/mfml/interfaces/IConfig.html for the list of available options.
module.exports = {

  renameArgument: _.camelCase,

  renameMessageFunction: function (messageName) {
    return _.camelCase(messageName.substr(messageName.indexOf('.') + 1));
  },

  renameInterface: function (messageName) {
    return _.upperFirst(_.camelCase(messageName.substr(messageName.indexOf('.') + 1))) + 'Values';
  },

  // Options below this line are from https://smikhalevski.github.io/mfml/interfaces/ILocaleFilesAdapterOptions.html
  digestFilePath: './index.ts',

  renameNamespace: function (messageName) {
    return _.upperFirst(_.camelCase(messageName.substr(0, messageName.indexOf('.'))));
  },

  rewriteFilePath: function (namespace) {
    return './' + namespace;
  },
};
