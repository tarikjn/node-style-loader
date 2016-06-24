module.exports = function clientCleanup() {
  var elements = document.getElementsByClassName('server-style-loader-element')
  Array.prototype.forEach.call(elements, function(element) {
    element.remove();
  });
}
