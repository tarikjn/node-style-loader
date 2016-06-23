var stylesInStack = {},
    stack = [],
    singletonCounter = 0

function listToStyles(list) {
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

function addStylesToStack(styles, options) {
  for(var i = 0; i < styles.length; i++) {
    var item = styles[i];
    var stackStyle = stylesInStack[item.id];
    if(stackStyle) {
      stackStyle.refs++;
      for(var j = 0; j < stackStyle.parts.length; j++) {
        stackStyle.parts[j](item.parts[j]); // calls update function
      }
      for(; j < item.parts.length; j++) {
        stackStyle.parts.push(addStyle(item.parts[j], options));
      }
    } else {
      var parts = [];
      for(var j = 0; j < item.parts.length; j++) {
        parts.push(addStyle(item.parts[j], options));
      }
      stylesInStack[item.id] = {id: item.id, refs: 1, parts: parts};
    }
  }
}

function addStyle(obj) {
  var styleElement, update, remove;

  var styleIndex = singletonCounter++;
  styleElement = stack;
  update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
  remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);

  update(obj);

  return function updateStyle(newObj) {
    if(newObj) {
      if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
        return;
      update(obj = newObj);
      console.log("UNEXPECTED: update")
    } else {
      remove();
      console.log("UNEXPECTED: remove")
    }
  };
}

function applyToSingletonTag(styleElement, index, remove, obj) {
  var css = remove ? "" : obj.css;

  stack.push(css);
  //console.log(stack);

  // if (styleElement.styleSheet) {
  //   styleElement.styleSheet.cssText = replaceText(index, css);
  // } else {
  //   var cssNode = document.createTextNode(css);
  //   var childNodes = styleElement.childNodes;
  //   if (childNodes[index]) styleElement.removeChild(childNodes[index]);
  //   if (childNodes.length) {
  //     styleElement.insertBefore(cssNode, childNodes[index]);
  //   } else {
  //     styleElement.appendChild(cssNode);
  //   }
  // }
}

exports.collect = function collect(fn) {

  const result = fn()

  return [
    stack.join("\n"),
    result
  ]
}

exports.add = function add(list, options) {

    // this only works as expected if the style import in made in the component's render

    var styles = listToStyles(list);
    addStylesToStack(styles, options);
}


// module.exports = function collect(fn) {

//   var stack = [],
//       processedModules = []

//   function add(moduleId, css) {

//     // Make sure we don't collect the same style twice
//     if (processedModules.indexOf(moduleId) < 0) {
//       stack.push(css)
//       processedModules.push(moduleId)
//     }
//   }
//   const ex = exports.add

//   exports.add = add
//   const result = fn()
//   exports.add = ex

//   return [
//     stack.join("\n"),
//     result
//   ]
// }

// module.exports.add = function() {}
