var _ = require('lodash');

const NAMESPACE_SEPARATOR = '/';

// Refer to https://smikhalevski.github.io/mfml/interfaces/IConfig.html for the list of available options.
module.exports = {

  renameArgument: _.camelCase,

  renameMessageFunction: function (messageName) {
    return _.camelCase(messageName.split(NAMESPACE_SEPARATOR)[1]);
  },

  renameInterface: function (messageName) {
    return _.upperFirst(_.camelCase(messageName.split(NAMESPACE_SEPARATOR)[1])) + 'Values';
  },

  // Returns the TypeScript type that is required for a function.
  // The code below would make `my_argument` in `{my_argument,date,YYYY-MM-DD}` to be `Date` or `number`.
  provideFunctionType: function (functionName) {
    if (functionName === 'date') {
      return 'Date|number';
    }
  },

  // Add a doc comment to each message function.
  extractComment: function (messageName, message) {
    return 'Message name: ' + messageName;
  },

  // Render additional code for each message function.
  // This example would add a display name.
  renderMetadata: function (metadata, messageName, message) {
    return metadata.functionName + '.displayName=' + JSON.stringify(messageName) + ';';
  },

  // Options below this line are from https://smikhalevski.github.io/mfml/interfaces/ILocaleFilesAdapterOptions.html

  digestModulePath: './index',

  renameNamespace: function (messageName) {
    return _.upperFirst(_.camelCase(messageName.split(NAMESPACE_SEPARATOR)[0])) + 'Messages';
  },

  rewriteModulePath: function (namespace) {
    return './' + namespace;
  },
};
