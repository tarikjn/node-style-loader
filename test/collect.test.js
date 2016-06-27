var collect = require("../collect.js");
var styleStack = require("../lib/styleStack");

var makeDummyItem = function (id) {
  return [id, "css"+id.toString(), "media"+id.toString(), "sourceMap"+id.toString()];
};

//the API only exposes a bound add function, so we can't use it on a new style stack
//this only works because none of the methods have any closured variables.
var resetGlobalStyleStackContents = function () {
  var dummy = new styleStack;
  for(i in global.initialStyleStack) {
    global.initialStyleStack[i] = dummy[i];
  }
}

var originalAdd = collect.add

var isProbablyStyleTag = function (str) {
  return (str.startsWith("<style") && str.endsWith("</style>"))
}

describe("add", function () {
  beforeEach(function () {
    this.addStylesToStack = sinon.spy(global.initialStyleStack, "addStylesToStack");

    this.listToStyles = sinon.spy(styleStack, "listToStyles");
    this.list = [
      makeDummyItem("1"),
    ];
    this.opts = {};
  })

  afterEach(function () {
    this.listToStyles.restore();
    this.addStylesToStack.restore();
    resetGlobalStyleStackContents();
  });

  it("should call listToStyles with the list argument", function () {
    collect.add(this.list, this.opts);
    expect(this.listToStyles).to.have.been.calledWith(this.list);
  });

  it("should call addStylesToStack with the return of listToStyles and the options argument", function () {
    collect.add(this.list, this.opts);
    expect(global.initialStyleStack.addStylesToStack).to.have.been.calledWith(styleStack.listToStyles(this.list), this.opts);
  });

  it.skip("should put the right stuff in the global styleStack (I'll flesh out what this means later)", function () {});
});

describe("collectInitial", function () {

  beforeEach(function () {
    this.getStyleTag = sinon.spy(global.initialStyleStack, "getStyleTag");
  });

  afterEach(function () {
    this.getStyleTag.restore();
  });

  it("should call getStyleTag", function () {
    collect.collectInitial();
    expect(global.initialStyleStack.getStyleTag).to.have.been.calledWith();
  });

  it("should set add to a noop function", function () {
    collect.collectInitial();
    expect(collect.add).to.not.be.equal(originalAdd);

    expect(collect.add([makeDummyItem("0")])).to.be.eql(undefined); //add shouldn't return anything anyway.
    expect(global.initialStyleStack.stylesInStack.refs).to.be.eql(undefined); //no styles should be added to stack after the above call
  });

  it("should return a style tag in a string", function () {
    var style = collect.collectInitial();
    expect(isProbablyStyleTag(style)).to.be.ok;
  });
});

describe("collectContext", function () {

  beforeEach(function () {
    this.list = [makeDummyItem("0")];
    this.opts = {};

    this.argFuncReturn = "the return of the passed in function";
    this.firstAdd = sinon.spy(collect, "add");

    this.argFunc = function () {
      this.intermediateAdd = collect.add
      this.intermediateAddSpy = sinon.spy(collect, "add");
      collect.add(this.list, this.opts);
      return this.argFuncReturn;
    }.bind(this);

    this.argFunc = sinon.spy(this, "argFunc");
  });

  afterEach(function () {
    this.firstAdd.restore();
    this.intermediateAddSpy.restore();
  });

  it("should call the passed in function and return an array whose first element is a style tag and whose second is the funtion's result", function () {
    var result = collect.collectContext(this.argFunc);

    expect(this.argFunc).to.have.been.called;

    expect(result.length).to.be.eql(2);
    expect(isProbablyStyleTag(result[0])).to.be.ok;
    expect(result[1]).to.be.eql(this.argFuncReturn);
  });

  it("should rebind add before calling the passed in function and then set it to a noop before returning", function () {
    collect.collectContext(this.argFunc);

    expect(this.firstAdd).to.not.have.been.called;
    expect(this.firstAdd).to.not.be.eql(this.intermediateAdd);

    expect(this.intermediateAddSpy).to.have.been.calledWith(this.list, this.opts);
    expect(global.initialStyleStack.stylesInStack.refs).to.be.eql(undefined);

    expect(collect.add).to.not.be.eql(this.intermediateAdd);

  });
})
