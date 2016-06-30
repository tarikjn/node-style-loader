var rewire = require('rewire'); //rewire doesn't play well with our setup.js.  I'll investigate eventually, for now, it's required separately in each test package
var styleStack = require("../lib/styleStack");

var rewireCollect = function () { //use with .call(this) in a before or beforeEach callback
  global.initialStyleStack = new styleStack;
  this.collect = rewire("../collect.js");
};

var makeDummyItem = function (id, counter) {
  if (counter !== undefined) {
    return [id, ("css"+id)+counter, ("media"+id)+counter, ("sourceMap"+id)+counter];
  } else {
    return [id, "css"+id, "media"+id, "sourceMap"+id];
  }
};

var isProbablyStyleTag = function (str) {
  return (str.startsWith("<style") && str.endsWith("</style>"));
};

describe("add", function () {
  beforeEach(function () {
    rewireCollect.call(this); //this allows us to reset the package's global scope, including add's binding
    this.addStylesToStack = sinon.spy(global.initialStyleStack, "addStylesToStack");

    this.listToStyles = sinon.spy(styleStack, "listToStyles");
    this.list = [
      makeDummyItem("1")
    ];
    this.opts = {};
  });
  afterEach(function () {
    this.addStylesToStack.restore();
    this.listToStyles.restore();
  })

  it("should call listToStyles with the list argument", function () {
    this.collect.add(this.list, this.opts);
    expect(this.listToStyles).to.have.been.calledWith(this.list);
  });

  it("should call addStylesToStack with the return of listToStyles and the options argument", function () {
    this.collect.add(this.list, this.opts);
    expect(global.initialStyleStack.addStylesToStack).to.have.been.calledWith(styleStack.listToStyles(this.list), this.opts);
  });

  it("after calling, if the bound styleStack's cssText field started empty, all input styles should be inserted into the cssText field grouped by id", function () {
    var list = [
      makeDummyItem(3, 0),
      makeDummyItem(1, 0),
      makeDummyItem(3, 1),
      makeDummyItem(2, 0),
      makeDummyItem(2, 1),
      makeDummyItem(1, 1)
    ];
    this.collect.add(list, this.opts);

    expect(global.initialStyleStack.stackStyleElement.cssText).to.be.eql("css30\ncss31\ncss10\ncss11\ncss20\ncss21");
  });
  it("after calling, if the bound styleStack's cssText field started non-empty, all input styles should be inserted into the cssText field", function () {
    var initialList = [
      makeDummyItem(1, 0),
      makeDummyItem(2, 0),
      makeDummyItem(3, 0),
    ];
    this.collect.add(initialList, this.opts);
    expect(global.initialStyleStack.stackStyleElement.cssText).to.be.eql("css10\ncss20\ncss30");

    var newList = [
      makeDummyItem(3, 1),
      makeDummyItem(1, 1),
      makeDummyItem(2, 1),

      makeDummyItem(2, 2),
      makeDummyItem(3, 2),
      makeDummyItem(1, 2),
      makeDummyItem(1, 3),
      makeDummyItem(2, 3),
      makeDummyItem(3, 3)
    ];
    this.collect.add(newList, this.opts);
    expect(global.initialStyleStack.stackStyleElement.cssText).to.be.eql("css11\ncss21\ncss31" + "\ncss32\ncss33" + "\ncss12\ncss13" + "\ncss22\ncss23")
    //notice the order.  for the ids in the initialList, they're directly replaced by the earliest element with the same id from newList
    //after those spots are taken up the grouping is per id, with the ids ordered acording to their first appearance in newList.

  });
});

describe("collectInitial", function () {

  beforeEach(function () {
    rewireCollect.call(this);
    this.originalAdd = this.collect.add;
    this.getStyleTag = sinon.spy(global.initialStyleStack, "getStyleTag");
  });

  afterEach(function () {
    this.getStyleTag.restore();
  });

  it("should call getStyleTag", function () {
    this.collect.collectInitial();
    expect(global.initialStyleStack.getStyleTag).to.have.been.calledWith();
  });

  it("should set add to a noop function", function () {
    this.collect.collectInitial();
    expect(this.collect.add).to.not.be.equal(this.originalAdd);

    expect(global.initialStyleStack.stylesInStack.refs).to.be.eql(undefined); //no styles should be added to stack after the above call
  });

  it("should return a style tag in a string", function () {
    var style = this.collect.collectInitial();
    expect(isProbablyStyleTag(style)).to.be.ok;
  });
});

describe("collectContext", function () {

  beforeEach(function () {
    rewireCollect.call(this);

    this.list = [makeDummyItem("0")];
    this.opts = {};

    this.argFuncReturn = "the return of the passed in function";
    this.firstAdd = sinon.spy(this.collect, "add");

    this.argFunc = function () {
      this.intermediateAdd = this.collect.add
      this.intermediateAddSpy = sinon.spy(this.collect, "add");
      this.collect.add(this.list, this.opts);
      return this.argFuncReturn;
    }.bind(this);

    this.argFunc = sinon.spy(this, "argFunc");
  });

  afterEach(function () {
    this.firstAdd.restore();
    this.intermediateAddSpy.restore();
  });

  it("should call the passed in function and return an array whose first element is a style tag and whose second is the function's result", function () {
    var result = this.collect.collectContext(this.argFunc);

    expect(this.argFunc).to.have.been.called;

    expect(result.length).to.be.eql(2);
    expect(isProbablyStyleTag(result[0])).to.be.ok;
    expect(result[1]).to.be.eql(this.argFuncReturn);
  });

  it("should rebind add before calling the passed in function and then set it to a noop before returning", function () {
    this.collect.collectContext(this.argFunc);

    expect(this.firstAdd).to.not.have.been.called;
    expect(this.firstAdd).to.not.be.eql(this.intermediateAdd);

    expect(this.intermediateAddSpy).to.have.been.calledWith(this.list, this.opts);
    expect(global.initialStyleStack.stylesInStack.refs).to.be.eql(undefined);

    expect(this.collect.add).to.not.be.eql(this.intermediateAdd);

  });
})
