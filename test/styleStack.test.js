var styleStack = require("../lib/styleStack");

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
}

describe("listToStyles", function () {
  it("should return an array with the elements of the input list mapped into part objects", function () {
    var list = [
      makeDummyItem("1"),
      makeDummyItem("2"),
      makeDummyItem("3"),
      makeDummyItem("4"),
    ];
    var mappedList = styleStack.listToStyles(list);

    expect(itemIsPart(list[0], mappedList[0].parts[0])).to.be.eql(true);
    expect(mappedList[0].parts.length).to.be.eql(1);

    expect(itemIsPart(list[1], mappedList[1].parts[0])).to.be.eql(true);
    expect(mappedList[1].parts.length).to.be.eql(1);

    expect(itemIsPart(list[2], mappedList[2].parts[0])).to.be.eql(true);
    expect(mappedList[2].parts.length).to.be.eql(1);

    expect(itemIsPart(list[3], mappedList[3].parts[0])).to.be.eql(true);
    expect(mappedList[3].parts.length).to.be.eql(1);

    expect(mappedList.length).to.be.eql(4)
  });

  it("items with the same id should be in the same mapped elements", function () {
    var list = [
      makeDummyItem("1"),
      makeDummyItem("1"),
      makeDummyItem("2"),
      makeDummyItem("2"),
    ];

    list[1].css += "2";
    list[3].css += "2";

    var mappedList = styleStack.listToStyles(list);

    expect(mapElContainsItem(list[0], mappedList[0])).to.be.eql(true);
    expect(mapElContainsItem(list[1], mappedList[0])).to.be.eql(true);
    expect(mapElContainsItem(list[2], mappedList[0])).to.be.eql(false);
    expect(mapElContainsItem(list[3], mappedList[0])).to.be.eql(false);

    expect(mapElContainsItem(list[0], mappedList[1])).to.be.eql(false);
    expect(mapElContainsItem(list[1], mappedList[1])).to.be.eql(false);
    expect(mapElContainsItem(list[2], mappedList[1])).to.be.eql(true);
    expect(mapElContainsItem(list[3], mappedList[1])).to.be.eql(true);

    expect(mappedList.length).to.be.eql(2)
    expect(mappedList[0].parts.length).to.be.eql(2)
    expect(mappedList[1].parts.length).to.be.eql(2)
  })
})
