var styleStack = module.exports = function styleStack() {
  this.stylesInStack = {}; // this is stylesInDom in style-loader
  this.stackStyleElement = { // this is roughly equivalent to singletonElement in style-loader
    cssText: ""
  };
  this.singletonCounter = 0;
}

styleStack.prototype.addStylesToStack = function addStylesToStack(styles, options) {
  for(var i = 0; i < styles.length; i++) {
    var item = styles[i];
    var stackStyle = this.stylesInStack[item.id];
    if(stackStyle) {
      stackStyle.refs++;
      for(var j = 0; j < stackStyle.parts.length; j++) {
        stackStyle.parts[j](item.parts[j]); // calls updateStyle function
      }
      for(; j < item.parts.length; j++) {
        stackStyle.parts.push(this.addStyle(item.parts[j], options));
      }
    } else {
      var parts = [];
      for(var j = 0; j < item.parts.length; j++) {
        parts.push(this.addStyle(item.parts[j], options));
      }
      this.stylesInStack[item.id] = {id: item.id, refs: 1, parts: parts};
    }
  }
}

styleStack.prototype.addStyle = function addStyle(obj) {
  var styleIndex = this.singletonCounter++;
  var update = applyToSingletonTag.bind(null, this.stackStyleElement, styleIndex);

  update(obj); // call update once for first insertion

  return function updateStyle(newObj) {
    if(newObj) {
      if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
        return;
      update(obj = newObj); // this case is not properly handled and would only be reached
                            // if re-including a style while specifying a different sourceMap or media option
    }
  };
}

styleStack.prototype.getStyleTag = function getStyleTag() {
  return '<style class="server-style-loader-element">'+this.stackStyleElement.cssText+'</style>';
}

function applyToSingletonTag(styleElement, index, obj) {
  styleElement.cssText = replaceText(index, obj.css);
}

module.exports.listToStyles = function listToStyles(list) {
  var styles = [];
  var newStyles = {};
  for(var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = item[0];
    var css = item[1];
    var media = item[2];
    var sourceMap = item[3];
    var part = {css: css, media: media, sourceMap: sourceMap};
    if(!newStyles[id])
      styles.push(newStyles[id] = {id: id, parts: [part]});
    else
      newStyles[id].parts.push(part);
  }
  return styles;
}


var replaceText = (function () {
  var textStore = [];

  return function (index, replacement) {
    textStore[index] = replacement;
    return textStore.filter(Boolean).join('\n');
  };
})();
