var styleStack = require('./lib/styleStack');
// it's necessary setting initialStyleStack as it may not be required as the same module between webpack and the user
// due to path differences in certain scenarios
global.initialStyleStack = (global.initialStyleStack !== undefined) ? global.initialStyleStack : new styleStack();

// initial style collection
exports.add = add.bind(null, initialStyleStack);

exports.collectInitial = function collectInitial(withTag = true) {
  var style = initialStyleStack.getStyle();
  exports.add = inactiveAdd;
  // commented-out so it doesn't have to be stored by the user and to test hot-reload
  //initialStyleStack = undefined;
  return withTag ? wrapInTag(style):style;
}

exports.collectContext = function collectContext(fn, withTag = true) {

  var contextStyleStack = new styleStack();

  // include path differences may make this fail, TODO: test
  exports.add = add.bind(null, contextStyleStack);
  var result = fn();
  exports.add = inactiveAdd;

  let style = contextStyleStack.getStyle()

  return [
    withTag ? wrapInTag(style):style,
    result
  ]
}

function add(stack, list, options) {
  var styles = styleStack.listToStyles(list);
  stack.addStylesToStack(styles, options);
}

function inactiveAdd() {}

function wrapInTag(style) {
  return '<style class="server-style-loader-element">'+style+'</style>';
}

exports.wrapInTag = wrapInTag
