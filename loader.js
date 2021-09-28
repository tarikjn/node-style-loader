var loaderUtils = require("loader-utils"),
           path = require("path");

module.exports = function() {};

module.exports.pitch = function(remainingRequest) {

  if (this.cacheable) {
    this.cacheable();
  }

  //var query = loaderUtils.parseQuery(this.query);
  const options = loaderUtils.getOptions(this)
  const runtimeOptions = {
    injectType: options.injectType,
    attributes: options.attributes,
    // base: options.base,
  };

  return [
    "// style-collector: Loads CSS like style-loader, but pass the content to the style collector instead of inserting in the DOM",
    "",
    "// load the styles",
    "var content = require(" + loaderUtils.stringifyRequest(this, "!!" + remainingRequest) + ");",
    "content = content.__esModule ? content.default : content;",
    "if (typeof content === 'string') content = [[module.id, content, '']];",
    "// collect the styles",
    "require(" + loaderUtils.stringifyRequest(this, path.join(__dirname, "collect.js")) + ").add(content, " + JSON.stringify(runtimeOptions) + ");",
    "if (content.locals) module.exports = content.locals;",

    // Remove from the cache to keep collecting
    "delete require.cache[module.id];"
  ].join("\n");
};
