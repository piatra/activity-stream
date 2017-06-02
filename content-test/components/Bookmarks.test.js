const ConnectedSpotlight = require("components/Spotlight/Spotlight");
const ConnectedBookmarks = require("components/Bookmarks/Bookmarks");
const {PlaceholderSpotlightItem, SpotlightItem} = ConnectedSpotlight;
const {Bookmarks} = ConnectedBookmarks;
const getHighlightContextFromSite = require("common/selectors/getHighlightContextFromSite");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const {PlaceholderHighlightContext, HighlightContext} = require("components/HighlightContext/HighlightContext");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {shallow} = require("enzyme");
const {mockData, mountWithProvider, faker, renderWithProvider} = require("test/test-utils");
const fakeSpotlightItems = mockData.Highlights.rows;
const fakeSiteWithImage = faker.createSite();
const {prettyUrl} = require("lib/utils");

fakeSiteWithImage.bestImage = fakeSiteWithImage.images[0];

describe("Bookmarks", () => {
  let instance;
  let el;

  describe("valid sites", () => {
    beforeEach(() => {
      instance = renderWithProvider(<Bookmarks sites={fakeSpotlightItems} prefs={{}} />);
      el = ReactDOM.findDOMNode(instance);
    });

    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render a SpotlightItem for each item", () => {
      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem);
      assert.equal(children.length, 3);
    });
    it("should not show any SpotlightItems if collapseBookmarks pref is true", () => {
      instance = renderWithProvider(<Bookmarks sites={fakeSpotlightItems} prefs={{collapseBookmarks: true}} />);
      assert.ok(instance.refs["bookmarks-list"].className.indexOf("collapsed") >= 0);
    });
  });
});
