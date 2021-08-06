var codegen = require('@smikhalevski/codegen');
var speedyEntities = require('speedy-entities/lib/full-cjs');
var path = require('path');

// https://smikhalevski.github.io/mfml/interfaces/ICliConfig.html
module.exports = {
  typingsEnabled: true,

  decodeText: speedyEntities.decodeHtml,
  decodeAttribute: speedyEntities.decodeHtml,

  renameArgument: codegen.camelCase,
  renameMessageFunction: function (messageName) {
    return codegen.camelCase(messageName.substr(messageName.indexOf('.') + 1));
  },
  renameInterface: function (messageName) {
    return codegen.pascalCase(messageName.substr(messageName.indexOf('.') + 1)) + 'Args';
  },

  adapter: 'mfml-cli/lib/adapters/localeFilesAdapter',

  // https://smikhalevski.github.io/mfml/interfaces/ILocaleFilesAdapterOptions.html
  digestFilePath: './index.ts',
  renameNamespace: function (messageName) {
    return codegen.pascalCase(messageName.substr(0, messageName.indexOf('.')));
  },
  rewriteFilePath: function (namespace) {
    return './' + namespace;
  },
};
