var styleStack = require('./lib/styleStack');
// it's necessary setting initialStyleStack as it may not be required as the same module between webpack and the user
// due to path differences in certain scenarios
global.initialStyleStack = (global.initialStyleStack !== undefined) ? global.initialStyleStack : new styleStack();

// initial style collection
exports.add = add.bind(null, initialStyleStack);

exports.collectInitial = function collectInitial() {
  var styleTag = initialStyleStack.getStyleTag();
  exports.add = inactiveAdd;
  // commented-out so it doesn't have to be stored by the user and to test hot-reload
  //initialStyleStack = undefined;
  return styleTag;
}

exports.collectContext = function collectContext(fn) {

  var contextStyleStack = new styleStack();

  // include path differences may make this fail, TODO: test
  exports.add = add.bind(null, contextStyleStack);
  var result = fn();
  exports.add = inactiveAdd;

  return [
    contextStyleStack.getStyleTag(),
    result
  ]
}

function add(stack, list, options) {
  var styles = styleStack.listToStyles(list);
  stack.addStylesToStack(styles, options);
}

function inactiveAdd() {}
