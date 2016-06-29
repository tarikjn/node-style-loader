var rewire = require("rewire");
//styleStack is rewired in for each test or each section of tests so that the global scope gets reset
var rewireStyleStack = function() { //should use with .call(this)
  this.styleStack = rewire("../lib/styleStack");
  this.styleStackInstance = new this.styleStack;
}

describe("listToStyles", function () {

  beforeEach(function () {
    rewireStyleStack.call(this);
  });

  var makeDummyItem = function (id) {
    return [id, "css"+id.toString(), "media"+id.toString(), "sourceMap"+id.toString()];
  };

  var itemIsPart = function (item, part) {
    return (part.css === item[1] && part.media === item[2] && part.sourceMap === item[3]);
  };

  var mapElContainsItem = function (item, mapEl) {
    if(item[0] !== mapEl.id) {
      return false;
    }
    for(var i = 0; i < mapEl.parts.length; ++i) {
      if(itemIsPart(item, mapEl.parts[i])) {
        return true;
      }
    }
    return false;
  };

  it("should return an array with the elements of the input list mapped into part objects", function () {
    var list = [
      makeDummyItem("1"),
      makeDummyItem("2"),
      makeDummyItem("3"),
      makeDummyItem("4"),
    ];
    var mappedList = this.styleStack.listToStyles(list);

    expect(itemIsPart(list[0], mappedList[0].parts[0])).to.be.eql(true);
    expect(mappedList[0].parts.length).to.be.eql(1);

    expect(itemIsPart(list[1], mappedList[1].parts[0])).to.be.eql(true);
    expect(mappedList[1].parts.length).to.be.eql(1);

    expect(itemIsPart(list[2], mappedList[2].parts[0])).to.be.eql(true);
    expect(mappedList[2].parts.length).to.be.eql(1);

    expect(itemIsPart(list[3], mappedList[3].parts[0])).to.be.eql(true);
    expect(mappedList[3].parts.length).to.be.eql(1);

    expect(mappedList.length).to.be.eql(4);
  });

  it("items with the same id should be in the same mapped elements", function () {
    var list = [
      makeDummyItem("1"),
      makeDummyItem("1"),
      makeDummyItem("2"),
      makeDummyItem("2"),
    ];

    list[1].css += "2"; //this line makes it so that the item at 0 has different css than the one at 1.
    list[3].css += "2"; //similarly to above.

    var mappedList = this.styleStack.listToStyles(list);

    expect(mapElContainsItem(list[0], mappedList[0])).to.be.eql(true);
    expect(mapElContainsItem(list[1], mappedList[0])).to.be.eql(true);
    expect(mapElContainsItem(list[2], mappedList[0])).to.be.eql(false);
    expect(mapElContainsItem(list[3], mappedList[0])).to.be.eql(false);

    expect(mapElContainsItem(list[0], mappedList[1])).to.be.eql(false);
    expect(mapElContainsItem(list[1], mappedList[1])).to.be.eql(false);
    expect(mapElContainsItem(list[2], mappedList[1])).to.be.eql(true);
    expect(mapElContainsItem(list[3], mappedList[1])).to.be.eql(true);

    expect(mappedList.length).to.be.eql(2);
    expect(mappedList[0].parts.length).to.be.eql(2);
    expect(mappedList[1].parts.length).to.be.eql(2);
  });
});

describe("replaceText", function () {
  before(function () {
    this.applyInputsToReplaceText = function (applyList) {
      return applyList.map(function (appliedArgs) {
        return this.replaceText.apply(this.styleStackInstance, appliedArgs);
      }, this);
    }
  });


  beforeEach(function () {
    rewireStyleStack.call(this);
    this.replaceText = this.styleStackInstance.replaceText || this.styleStack.__get__("replaceText");
  });

  it("should return a string containing a newline separated list of the items put into it (no index collisions, no empty strings)", function () {
    var applyList = [
      [0, "string0"],
      [1, "string1"],
      [2, "string2"],
      [3, "string3"]
    ];
    var expectedOutputs = [
      "string0",
      "string0\nstring1",
      "string0\nstring1\nstring2",
      "string0\nstring1\nstring2\nstring3"
    ];

    var actualOutputs = this.applyInputsToReplaceText(applyList);

    expect(actualOutputs[0]).to.be.eql(expectedOutputs[0]);
    expect(actualOutputs[1]).to.be.eql(expectedOutputs[1]);
    expect(actualOutputs[2]).to.be.eql(expectedOutputs[2]);
    expect(actualOutputs[3]).to.be.eql(expectedOutputs[3]);

  });

  it("should ommit empty strings", function () {
    var applyList = [
      [0, "string0"],
      [1, ""],
      [2, "string2"],
      [3, "string3"]
    ];
    var expectedOutputs = [
      "string0",
      "string0",
      "string0\nstring2",
      "string0\nstring2\nstring3"
    ];

    var actualOutputs = this.applyInputsToReplaceText(applyList);

    expect(actualOutputs[0]).to.be.eql(expectedOutputs[0]);
    expect(actualOutputs[1]).to.be.eql(expectedOutputs[1]);
    expect(actualOutputs[2]).to.be.eql(expectedOutputs[2]);
    expect(actualOutputs[3]).to.be.eql(expectedOutputs[3]);
  });

  it("if two inputs use the same index, the first input should be overwritten by the second", function () {
    var applyList = [
      [0, "string0"],
      [1, "string1"],
      [1, "string2"],
      [3, "string3"]
    ];
    var expectedOutputs = [
      "string0",
      "string0\nstring1",
      "string0\nstring2",
      "string0\nstring2\nstring3"
    ];

    var actualOutputs = this.applyInputsToReplaceText(applyList);

    expect(actualOutputs[0]).to.be.eql(expectedOutputs[0]);
    expect(actualOutputs[1]).to.be.eql(expectedOutputs[1]);
    expect(actualOutputs[2]).to.be.eql(expectedOutputs[2]);
    expect(actualOutputs[3]).to.be.eql(expectedOutputs[3]);
  });

  it("if called with a different styleStack as context, should not have any of the elements from the original styleStack", function () {
    var originalApplyList = [
      [0, "string0"],
      [2, "string1"],
      [1, "string2"],
      [3, "string3"]
    ];
    var alternateApplyList =  [
      [0, "string4"],
      [1, "string5"]
    ];
    var expectedOutputs = [
      "string4",
      "string4\nstring5"
    ];
    var originalOutputs = this.applyInputsToReplaceText(originalApplyList);

    this.styleStackInstance = new this.styleStack; //context is set inside of applyInputsToReplaceText
    this.replaceText = this.styleStackInstance.replaceText || this.styleStack.__get__("replaceText");
    var alternateOutputs = this.applyInputsToReplaceText(alternateApplyList);

    expect(alternateOutputs[0]).to.be.eql(expectedOutputs[0]);
    expect(alternateOutputs[1]).to.be.eql(expectedOutputs[1]);

  });
});

describe("applyToSingletonTag", function () {

  beforeEach(function () {
    rewireStyleStack.call(this);
    this.applyToSingletonTag = this.styleStack.__get__("applyToSingletonTag");

    this.styleElement = {cssText: ""};

  });

  it("should replace the styleElement's cssText with the string generated by setting the text that index indicates to the passed in obj's css property", function () {

    this.applyToSingletonTag(this.styleElement, 0, {css:"string0"});
    expect(this.styleElement).to.be.eql({cssText: "string0"});

    this.applyToSingletonTag(this.styleElement, 1, {css:"string1"});
    expect(this.styleElement).to.be.eql({cssText: "string0\nstring1"});

    this.applyToSingletonTag(this.styleElement, 1, {css:"string2"});
    expect(this.styleElement).to.be.eql({cssText: "string0\nstring2"});

  });
  //this function is mostly for binding in a styleElement and indexand has very little behavior outside of replaceText, so it doesn't need much testing
});

describe("addStyle", function () {
  beforeEach(function () {
    rewireStyleStack.call(this);
  });

  it("should increment singletonCounter", function () {
    this.styleStackInstance.addStyle({css: "string0"});
    expect(this.styleStackInstance.singletonCounter).to.be.eql(1);

    this.styleStackInstance.addStyle({css: "string0"});
    expect(this.styleStackInstance.singletonCounter).to.be.eql(2);
  });

  it("should append the style to the stack's cssText string", function () {
    this.styleStackInstance.addStyle({css: "string0"});
    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string0");

    this.styleStackInstance.addStyle({css: "string1"});
    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string0\nstring1");

    this.styleStackInstance.addStyle({css: "string1"});
    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string0\nstring1\nstring1");
  });

  it("if the css property of the object is an empty string or undefined, should not be included in cssText.", function () {
    this.styleStackInstance.addStyle({css: ""});
    this.styleStackInstance.addStyle({css:"string1"});
    this.styleStackInstance.addStyle({});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string1");
  })

  it("when the returned function is called, it should update the correct element", function () {
    var update0 = this.styleStackInstance.addStyle({css: "string0"});
    var update1 = this.styleStackInstance.addStyle({css: "string1"});
    var update2 = this.styleStackInstance.addStyle({css: "string2"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string0\nstring1\nstring2");

    update0({css: "string3"});
    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string3\nstring1\nstring2");

    update1({css: "string4"});
    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string3\nstring4\nstring2");

    update2({css: "string5"});
    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string3\nstring4\nstring5");
  });

  it("when the returned function is called with undefined, it should not be included in cssText", function () {
    var update0 = this.styleStackInstance.addStyle({css: "string0"});
    var update1 = this.styleStackInstance.addStyle({css: "string1"});
    var update2 = this.styleStackInstance.addStyle({css: "string2"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string0\nstring1\nstring2");

    update0(undefined);

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string1\nstring2");

    update2(undefined);

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string1");

    update1(undefined);

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("");

    update0
  })

  it("if the css property of the input to the returned function is an empty string or undefined, it should not be included in cssText", function () {
    var update0 = this.styleStackInstance.addStyle({css: "string0"});
    var update1 = this.styleStackInstance.addStyle({css: "string1"});
    var update2 = this.styleStackInstance.addStyle({css: "string2"});

    update0({css: ""});
    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string1\nstring2");

    update2({});
    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string1");

    update0({css: "string3"});
    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string3\nstring1");
  });

  it("should treat different stacks separately on initial call", function () {
    var update0 = this.styleStackInstance.addStyle({css: "string0"});
    var update1 = this.styleStackInstance.addStyle({css: "string1"});
    var update2 = this.styleStackInstance.addStyle({css: "string2"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.equal("string0\nstring1\nstring2");

    alternateStyleStack = new this.styleStack;

    var update3 = alternateStyleStack.addStyle({css: "string3"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.equal("string0\nstring1\nstring2");
    expect(alternateStyleStack.stackStyleElement.cssText).to.be.equal("string3");

    var update4 = alternateStyleStack.addStyle({css: "string4"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.equal("string0\nstring1\nstring2");
    expect(alternateStyleStack.stackStyleElement.cssText).to.be.equal("string3\nstring4");

    var update5 = alternateStyleStack.addStyle({css: "string5"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.equal("string0\nstring1\nstring2");
    expect(alternateStyleStack.stackStyleElement.cssText).to.be.equal("string3\nstring4\nstring5");

  });

  it("should treat different stacks separately on updates", function () {
    var update0 = this.styleStackInstance.addStyle({css: "string0"});
    var update1 = this.styleStackInstance.addStyle({css: "string1"});
    var update2 = this.styleStackInstance.addStyle({css: "string2"});

    alternateStyleStack = new this.styleStack;

    var update3 = alternateStyleStack.addStyle({css: "string3"});
    var update4 = alternateStyleStack.addStyle({css: "string4"});
    var update5 = alternateStyleStack.addStyle({css: "string5"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string0\nstring1\nstring2");
    expect(alternateStyleStack.stackStyleElement.cssText).to.be.eql("string3\nstring4\nstring5");

    update0({css: "string6"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string6\nstring1\nstring2");
    expect(alternateStyleStack.stackStyleElement.cssText).to.be.eql("string3\nstring4\nstring5");

    update5({css: "string7"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("string6\nstring1\nstring2");
    expect(alternateStyleStack.stackStyleElement.cssText).to.be.eql("string3\nstring4\nstring7");

  });

});

describe("getStyleTag", function () {
  beforeEach(function () {
    rewireStyleStack.call(this);
  });

  it("should return the stack's css tag text wrapped in a style tag with the class \"server-style-loader-element\"", function () {
    var text = this.styleStackInstance.stackStyleElement.cssText = "string";
    var expected = '<style class="server-style-loader-element">'+text+'</style>';
    var actual = this.styleStackInstance.getStyleTag();
    expect(actual).to.be.eql(expected);
  });
});

describe("addStylesToStack", function () {
  beforeEach(function () {
    rewireStyleStack.call(this);
    this.opts = {};
  });

  var makeDummyPart = function (id, counter) {
    return {
      css: ("css" + id) + counter,
      media: ("media" + id) + counter,
      sourceMap: ("sourceMap" + id) + counter
    };
  };

  var makeDummyStyle = function (id, counter) {
    return {
      id: id,
      parts: [
        makeDummyPart(id, counter++),
        makeDummyPart(id, counter)
      ]
    };
  };


  it("On initial call, if there are no duplicate ids in the input, the stack's stylesInStack property should contain all of the input styles ids.", function () {

    var styles = [
      makeDummyStyle(3, 0),
      makeDummyStyle(1, 0),
      makeDummyStyle(2, 0),
    ];
    this.styleStackInstance.addStylesToStack(styles);

    expect(this.styleStackInstance.stylesInStack[3].id).to.be.eql(styles[0].id);
    expect(this.styleStackInstance.stylesInStack[1].id).to.be.eql(styles[1].id);
    expect(this.styleStackInstance.stylesInStack[2].id).to.be.eql(styles[2].id);

    expect(this.styleStackInstance.stylesInStack[3].refs).to.be.eql(1);
    expect(this.styleStackInstance.stylesInStack[1].refs).to.be.eql(1);
    expect(this.styleStackInstance.stylesInStack[2].refs).to.be.eql(1);

  });

  it("If there are no duplicate ids in the input, the stack's stylesInStack property should contain correct update functions for each part of each style", function () {
    var styles = [
      makeDummyStyle(3, 0),
      makeDummyStyle(1, 0),
      makeDummyStyle(2, 0),
    ];
    this.styleStackInstance.addStylesToStack(styles, this.opts);

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css30\ncss31\ncss10\ncss11\ncss20\ncss21");

    this.styleStackInstance.stylesInStack[3].parts[0]({css:"css32"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css32\ncss31\ncss10\ncss11\ncss20\ncss21"); //first element changed (the first part with id 3)

    this.styleStackInstance.stylesInStack[1].parts[1]({css:"css12"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css32\ncss31\ncss10\ncss12\ncss20\ncss21"); //fourth element changed (the second part with id 1)

    var newStyles = [
      makeDummyStyle(4, 0),
      makeDummyStyle(0, 0)
    ];
    this.styleStackInstance.addStylesToStack(newStyles, this.opts);

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css32\ncss31\ncss10\ncss12\ncss20\ncss21\ncss40\ncss41\ncss00\ncss01");

    this.styleStackInstance.stylesInStack[3].parts[1]({css: "css33"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css32\ncss33\ncss10\ncss12\ncss20\ncss21\ncss40\ncss41\ncss00\ncss01"); //the second element changed (the second part with id 3)

    this.styleStackInstance.stylesInStack[4].parts[0]({css: "css42"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css32\ncss33\ncss10\ncss12\ncss20\ncss21\ncss42\ncss41\ncss00\ncss01"); // the fourth to last element changed (the first part with id 4)

    this.styleStackInstance.stylesInStack[0].parts[1]({css: "css02"});

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css32\ncss33\ncss10\ncss12\ncss20\ncss21\ncss42\ncss41\ncss00\ncss02"); //last element changed (the second part with id 0)
  });

  it("If there are dupicate ids in the input, and the duplicate is the same length as what is already in the stack for that id, the existing parts are overwritten", function () {
    var styles = [
      makeDummyStyle(0, 0),
      makeDummyStyle(1, 0),
    ];
    this.styleStackInstance.addStylesToStack(styles);

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css00\ncss01\ncss10\ncss11");

    var newStyles = [
      makeDummyStyle(0, 2)
    ];
    this.styleStackInstance.addStylesToStack(newStyles);

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css02\ncss03\ncss10\ncss11");

  });

  it("If there are dupicate ids in the input, and the duplicate is longer than what is already in the stack for that id, the existing parts are overwritten and the excess is appended to the end of the cssText", function () {
    var styles = [
      makeDummyStyle(0, 0),
      makeDummyStyle(1, 0),
    ];
    this.styleStackInstance.addStylesToStack(styles);

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css00\ncss01\ncss10\ncss11");

    var newStyles = [
      makeDummyStyle(0, 2)
    ];
    newStyles[0].parts = newStyles[0].parts.concat(makeDummyStyle(0, 4).parts)
    this.styleStackInstance.addStylesToStack(newStyles);

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css02\ncss03\ncss10\ncss11\ncss04\ncss05");

  });

  it("If there are dupicate ids in the input, and the duplicate is shorter than what is already in the stack for that id, parts in the stack will be overwritten up to the length of the input, but ommited after.  The ommitted parts will still have update functions in that style's parts", function () {
    var styles = [
      makeDummyStyle(0, 0),
      makeDummyStyle(1, 0),
    ];
    this.styleStackInstance.addStylesToStack(styles);

    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css00\ncss01\ncss10\ncss11");

    var newStyles = [
      makeDummyStyle(0, 2)
    ];
    newStyles[0].parts = newStyles[0].parts.slice(0,1);
    var ommittedPart = this.styleStackInstance.stylesInStack[0].parts[1];
    this.styleStackInstance.addStylesToStack(newStyles);


    expect(this.styleStackInstance.stackStyleElement.cssText).to.be.eql("css02\ncss10\ncss11");
    expect(this.styleStackInstance.stylesInStack[0].parts[1]).to.be.eql(ommittedPart);

  });

});
