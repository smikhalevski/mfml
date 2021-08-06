var codegen = require('@smikhalevski/codegen');

// https://smikhalevski.github.io/mfml/interfaces/ICliConfig.html
module.exports = {

  renameArgument: codegen.camelCase,
  renameMessageFunction: function (messageName) {
    return codegen.camelCase(messageName.substr(messageName.indexOf('.') + 1));
  },
  renameInterface: function (messageName) {
    return codegen.pascalCase(messageName.substr(messageName.indexOf('.') + 1)) + 'Args';
  },

  // https://smikhalevski.github.io/mfml/interfaces/ILocaleFilesAdapterOptions.html
  digestFilePath: './index.ts',
  renameNamespace: function (messageName) {
    return codegen.pascalCase(messageName.substr(0, messageName.indexOf('.')));
  },
  rewriteFilePath: function (namespace) {
    return './' + namespace;
  },
};
