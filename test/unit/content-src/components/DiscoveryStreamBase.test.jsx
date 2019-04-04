import {isAllowedCSS} from "content-src/components/DiscoveryStreamBase/DiscoveryStreamBase";
import {_DiscoveryStreamBase as DiscoveryStreamBase} from "content-src/components/DiscoveryStreamBase/DiscoveryStreamBase";
import {HorizontalRule} from "content-src/components/DiscoveryStreamComponents/HorizontalRule/HorizontalRule";
import {List} from "content-src/components/DiscoveryStreamComponents/List/List";
import {Hero} from "content-src/components/DiscoveryStreamComponents/Hero/Hero";
import {CardGrid} from "content-src/components/DiscoveryStreamComponents/CardGrid/CardGrid";
import {Navigation} from "content-src/components/DiscoveryStreamComponents/Navigation/Navigation";
import {SectionTitle} from "content-src/components/DiscoveryStreamComponents/SectionTitle/SectionTitle";
import {DSMessage} from "content-src/components/DiscoveryStreamComponents/DSMessage/DSMessage";
import {TopSites} from "content-src/components/DiscoveryStreamComponents/TopSites/TopSites";
import * as selectors from "content-src/lib/selectLayoutRender";
import {GlobalOverrider} from "test/unit/utils";
import React from "react";
import {shallowWithIntl} from "test/unit/utils";

describe("<isAllowedCSS>", () => {
  it("should allow colors", () => {
    assert.isTrue(isAllowedCSS("color", "red"));
  });

  it("should allow resource urls", () => {
    assert.isTrue(isAllowedCSS("background-image", `url("resource://activity-stream/data/content/assets/glyph-info-16.svg")`));
  });

  it("should allow chrome urls", () => {
    assert.isTrue(isAllowedCSS("background-image", `url("chrome://browser/skin/history.svg")`));
  });

  it("should allow allowed https urls", () => {
    assert.isTrue(isAllowedCSS("background-image", `url("https://img-getpocket.cdn.mozilla.net/media/image.png")`));
  });

  it("should disallow other https urls", () => {
    assert.isFalse(isAllowedCSS("background-image", `url("https://mozilla.org/media/image.png")`));
  });

  it("should disallow other protocols", () => {
    assert.isFalse(isAllowedCSS("background-image", `url("ftp://mozilla.org/media/image.png")`));
  });

  it("should allow allowed multiple valid urls", () => {
    assert.isTrue(isAllowedCSS("background-image", `url("https://img-getpocket.cdn.mozilla.net/media/image.png"), url("chrome://browser/skin/history.svg")`));
  });

  it("should disallow if any invaild", () => {
    assert.isFalse(isAllowedCSS("background-image", `url("chrome://browser/skin/history.svg"), url("ftp://mozilla.org/media/image.png")`));
  });
});

describe("<DiscoveryStreamBase>", () => {
  let wrapper;
  let globals;
  let sandbox;
  let selectLayoutRenderStub;

  function mountComponent(props = {}) {
    const defaultProps = {
      layout: [],
      feeds: {loaded: true},
      spocs: {
        loaded: true,
        data: {spocs: null}
      },
      ...props,
    };
    return shallowWithIntl(<DiscoveryStreamBase DiscoveryStream={defaultProps} />);
  }

  beforeEach(() => {
    globals = new GlobalOverrider();
    sandbox = sinon.createSandbox();
    wrapper = mountComponent();
  });

  afterEach(() => {
    sandbox.restore();
    globals.restore();
  });

  it("should render null if spocs not loaded", () => {
    wrapper = mountComponent({spocs: {loaded: false, data: {spocs: null}}});

    assert.equal(wrapper.type(), null);
  });

  it("should render null if feeds not loaded", () => {
    wrapper = mountComponent({feeds: {loaded: false}});

    assert.equal(wrapper.type(), null);
  });

  it("should render", () => {
    assert.ok(wrapper.exists());
    assert.ok(wrapper.find(".discovery-stream").exists());
  });

  it("should render a HorizontalRule", () => {
    wrapper = mountComponent({layout: [{components: [{type: "HorizontalRule"}]}]});

    assert.equal(wrapper.find(".ds-column-grid div").children().at(0).type(), HorizontalRule);
  });

  it("should render a List", () => {
    wrapper = mountComponent({layout: [{components: [{properties: {}, type: "List"}]}]});

    assert.equal(wrapper.find(".ds-column-grid div").children().at(0).type(), List);
  });

  it("should render a Hero", () => {
    wrapper = mountComponent({layout: [{components: [{properties: {}, type: "Hero"}]}]});

    assert.equal(wrapper.find(".ds-column-grid div").children().at(0).type(), Hero);
  });

  it("should render a CardGrid", () => {
    wrapper = mountComponent({layout: [{components: [{properties: {}, type: "CardGrid"}]}]});

    assert.equal(wrapper.find(".ds-column-grid div").children().at(0).type(), CardGrid);
  });

  it("should render a Navigation", () => {
    wrapper = mountComponent({layout: [{components: [{properties: {}, type: "Navigation"}]}]});

    assert.equal(wrapper.find(".ds-column-grid div").children().at(0).type(), Navigation);
  });

  it("should render a Message", () => {
    wrapper = mountComponent({layout: [{components: [{properties: {}, type: "Message"}]}]});

    assert.equal(wrapper.find(".ds-column-grid div").children().at(0).type(), DSMessage);
  });

  it("should render a SectionTitle", () => {
    wrapper = mountComponent({layout: [{components: [{properties: {}, type: "SectionTitle"}]}]});

    assert.equal(wrapper.find(".ds-column-grid div").children().at(0).type(), SectionTitle);
  });

  it("should render TopSites", () => {
    wrapper = mountComponent({layout: [{components: [{properties: {}, type: "TopSites"}]}]});

    assert.equal(wrapper.find(".ds-column-grid div").children().at(0).type(), TopSites);
  });

  describe("#onStyleMount", () => {
    let parseStub;

    beforeEach(() => {
      parseStub = sandbox.stub();
      globals.set("JSON", {parse: parseStub});
    });

    afterEach(() => {
      sandbox.restore();
      globals.restore();
    })

    it("should return if no style", () => {
      assert.isUndefined(wrapper.instance().onStyleMount());
      assert.notCalled(parseStub);
    });

    it("should insert rules", () => {
      const sheetStub = {insertRule: sandbox.stub(), cssRules: [{}]};
      parseStub.returns([
        [
          null,
          {
            ".ds-message": "margin-bottom: -20px"
          },
          null,
          null
        ]
      ]);
      wrapper.instance().onStyleMount({sheet: sheetStub, dataset: {}}); 

      assert.calledOnce(sheetStub.insertRule);
      assert.calledWithExactly(sheetStub.insertRule, "DUMMY#CSS.SELECTOR {}");
    }); 
  });
});
