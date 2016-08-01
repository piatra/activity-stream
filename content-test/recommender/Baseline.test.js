/* globals describe, it, beforeEach */

const {Baseline} = require("common/recommender/Baseline");
const {assert} = require("chai");

const fakeHistory = [{
  reversedHost: "moc.elgoog.",
  visitCount: 1
},
{
  reversedHost: "moc.buhtig.",
  visitCount: 1
}]

const fakeUrls = [{
  url: "http://google.com/calendar",
  visitCount: 2,
  title: "Activity Stream",
  description: "",
  images: [],
  lastVisitDate: Date.now() - 1e2
},
{
  url: "http://github.com/mozilla/activity-stream",
  visitCount: 1,
  title: "Activity Stream",
  description: "",
  images: [],
  lastVisitDate: Date.now() - 1e2
},
{
  url: "http://github.com/mozilla/activity-stream",
  visitCount: 1,
  title: "Activity Stream",
  description: "",
  images: [],
  lastVisitDate: Date.now() - 1e2
}]

describe("Baseline", () => {
  let baseline;

  beforeEach(() => {
    baseline = new Baseline(fakeHistory);
  });

  it("should return a score for the urls", () => {
    let items = baseline.score(fakeUrls);
    assert.isNumber(items[0].score);
  });

  it("items should be sorted", () => {
    let items = baseline.score(fakeUrls);
    assert.isTrue(items[0].score > items[1].score);
  });

  it("remove consecutive items from the same domain", () => {
    let items = baseline.score(fakeUrls);
    assert.equal(items.length, 2);
  });
});
