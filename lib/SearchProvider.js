/* global XPCOMUtils, Task, Services, EventEmitter, FormHistory,
SearchSuggestionController, PrivateBrowsingUtils, exports, require */

"use strict";
const {Ci, Cu} = require("chrome");
const CURRENT_ENGINE = "browser-search-engine-modified";
const HIDDEN_ENGINES = "browser.search.hiddenOneOffs";
const ENGINE_ICON_SIZE = 16;
const MAX_LOCAL_SUGGESTIONS = 3;
const MAX_SUGGESTIONS = 6;
const {FullTextSearchStore} = require("lib/FullTextSearch.js");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.importGlobalProperties(["URL", "Blob", "FileReader", "atob"]);

XPCOMUtils.defineLazyModuleGetter(this, "FormHistory",
                                  "resource://gre/modules/FormHistory.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PrivateBrowsingUtils",
                                  "resource://gre/modules/PrivateBrowsingUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "SearchSuggestionController",
                                  "resource://gre/modules/SearchSuggestionController.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", function() {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

let NewTabSearchProvider = function NewTabSearchProvider() {
  EventEmitter.decorate(this);
};

NewTabSearchProvider.prototype = {

  // This is used to handle search suggestions.  It maps xul:browsers to objects
  // { controller, previousFormHistoryResult }.
  _suggestionMap: new WeakMap(),

  /**
   *  Observe current engine changes to notify all other newtab pages.
   */
  observe(subject, topic, data) {
    if (topic === CURRENT_ENGINE && data === "engine-current") {
      Task.spawn(function*() {
        let engine = this.currentEngine;
        this.emit(CURRENT_ENGINE, engine);
      }.bind(this));
    } else if (data === "engine-default") {
      // engine-default is always sent with engine-current and isn't
      // relevant to content searches.
      return;
    } else {
      Cu.reportError(new Error("NewTabSearchProvider observing unknown topic"));
    }
  },

  /**
   *  Initialize the Search Provider.
   */
  init() {
    Services.obs.addObserver(this, CURRENT_ENGINE, true);
    this._fullTextSearchStore = new FullTextSearchStore();
    Task.spawn(function*() {
      yield this._fullTextSearchStore.asyncConnect();
      yield this._fullTextSearchStore.asyncInsert([{
        url: "https://en.wikipedia.org/wiki/Full_text_search",
        title: "Full text search - Wikipedia",
        description: "",
        type: "html",
        last_visit: "2016-07-12 10:10:10",
        body: `In text retrieval, full text search refers to techniques for searching a single computer-stored document or a collection in a full text database. Full-text search is distinguished from searches based on metadata or on parts of the original texts represented in databases (such as titles, abstracts, selected sections, or bibliographical references).

        In a full-text search, a search engine examines all of the words in every stored document as it tries to match search criteria (for example, text specified by a user). Full-text-searching techniques became common in online bibliographic databases in the 1990s. Many websites and application programs (such as word processing software) provide full-text-search capabilities. Some web search engines, such as AltaVista, employ full-text-search techniques, while others index only a portion of the web pages examined by their indexing systems.`
      },
      {
        url: "https://en.wikipedia.org/wiki/SQLite",
        title: "SQLite - Wikipedia",
        description: "",
        type: "html",
        last_visit: "2016-07-12 14:08:10",
        body: `SQLite is a relational database management system contained in a C programming library. In contrast to many other database management systems, SQLite is not a client–server database engine. Rather, it is embedded into the end program.

        SQLite is ACID-compliant and implements most of the SQL standard, using a dynamically and weakly typed SQL syntax that does not guarantee the domain integrity.

        SQLite is a popular choice as embedded database software for local/client storage in application software such as web browsers. It is arguably the most widely deployed database engine, as it is used today by several widespread browsers, operating systems, and embedded systems (such as mobile phones), among others. SQLite has bindings to many programming languages.`
      },
      {
        url: "https://en.wikipedia.org/wiki/Firefox",
        title: "Firefox - Wikipedia",
        description: "",
        type: "html",
        last_visit: "2016-07-12 14:17:50",
        body: `Mozilla Firefox (or simply Firefox) is a free and open-source web browser developed by the Mozilla Foundation and its subsidiary, the Mozilla Corporation. Firefox is available for Windows, OS X and Linux operating systems, with its mobile versions available for Android, and Firefox OS; where all of these versions use the Gecko layout engine to render web pages, which implements current and anticipated web standards, but an additional version released in late 2015 – Firefox for iOS has also been made available – that doesn't use Gecko.

        Firefox was created in 2002, under the name "Phoenix" by the Mozilla community members who wanted a standalone browser rather than the Mozilla Application Suite bundle. Even during its beta phase, Firefox proved to be popular by its testers and was praised for its speed, security and add-ons compared to Microsoft's then-dominant Internet Explorer 6. Firefox was released in November 2004, and was highly successful with 60 million downloads within nine months, which was the first time that Internet Explorer's dominance was challenged. Firefox is considered the spiritual successor of Netscape Navigator, as the Mozilla community was created by Netscape in 1998 before their acquisition by AOL.

        As of January 2016, Firefox has between 9% and 16% of worldwide usage as a "desktop" browser, making it the second most popular web browser. Firefox is the most popular browser in Samoa, Germany, Eritrea and Cuba, with 61.05%, 38.36%, 79.39% and 85.93% of the market share, respectively. It is also the most popular desktop browser in many other African, and a few Asian countries. According to Mozilla, as of December 2014 there were half a billion Firefox users around the world. With Internet Explorer declining, Firefox reached second place in February 2016, as a desktop browser.`
      }]);
    }.bind(this));
  },

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver,
    Ci.nsISupportsWeakReference
  ]),

  /**
   *  Unintialize the Search Provider.
   */
  uninit() {
    Services.obs.removeObserver(this, CURRENT_ENGINE, true);
    this._fullTextSearchStore.asyncClose();
  },

  /**
   *  Sets the UI strings.
   */
  get searchSuggestionUIStrings() {
    return {
      "searchHeader": "%S Search",
      "searchForSomethingWith": "Search for",
      "searchSettings": "Change Search Settings",
      "searchPlaceholder": "Search the Web"
    };
  },

  /**
   *  Gets the current engine - a combination of the engine name and the icon URI.
   */
  get currentEngine() {
    const engine = Services.search.currentEngine;
    const favicon = engine.getIconURLBySize(ENGINE_ICON_SIZE, ENGINE_ICON_SIZE);
    let obj = {
      name: engine.name,
      iconBuffer: favicon,
    };
    return obj;
  },

  /**
   *  Removes an entry from the form history.
   */
  removeFormHistoryEntry(browser, entry) {
    let {previousFormHistoryResult} = this._suggestionMap.get(browser);
    if (!previousFormHistoryResult) {
      return false;
    }
    for (let i = 0; i < previousFormHistoryResult.matchCount; i++) {
      if (previousFormHistoryResult.getValueAt(i) === entry) {
        previousFormHistoryResult.removeValueAt(i, true);
        return true;
      }
    }
    return false;
  },

  /**
   *  Opens about:preferences#search in order to manage search settings.
   */
  manageEngines(browser) {
    const browserWindow = browser.ownerDocument.defaultView;
    browserWindow.openPreferences("paneSearch");
  },

  /**
   *  Change the current search engine and capture the new state.
   */
  cycleCurrentEngine(engineName) {
    Services.search.currentEngine = Services.search.getEngineByName(engineName);
    const newEngine = this.currentEngine;
    this.emit("CURRENT_ENGINE", newEngine);
  },

  /**
   *  Filter out activity that matches the search string and show it to the user.
   */
  getFilteredActivity: Task.async(function*(searchString) {
    return this._fullTextSearchStore.asyncMatchExact(searchString).then(pages => {
        console.log("PAGES:" + JSON.stringify(pages));
        return pages;
    });
  }),

  /**
   *  Gets the state - a combination of the current engine and all the visible engines.
   */
  asyncGetCurrentState: Task.async(function*() {
    let state = {
      engines: [],
      currentEngine: this.currentEngine,
    };
    const pref = Services.prefs.getCharPref(HIDDEN_ENGINES);
    const hiddenEngines = pref ? pref.split(",") : [];
    let result =  Services.search.getVisibleEngines().filter(engine => !hiddenEngines.includes(engine.name));
    for (let engine of result) {
      let favicon = engine.getIconURLBySize(ENGINE_ICON_SIZE, ENGINE_ICON_SIZE);
      state.engines.push({
        name: engine.name,
        iconBuffer: favicon,
      });
    }
    return state;
  }),

  /**
   *  Gets the suggestion based on the search string and the current engine.
   */
  asyncGetSuggestions: Task.async(function*(browser, data) {
    const engine = Services.search.getEngineByName(data.engineName);
    if (!engine) {
      throw new Error(`Unknown engine name: ${data.engineName}`);
    }
    let {controller} = this._getSuggestionData(browser);
    let ok = SearchSuggestionController.engineOffersSuggestions(engine);
    controller.maxLocalResults = ok ? MAX_LOCAL_SUGGESTIONS : MAX_SUGGESTIONS;
    controller.maxRemoteResults = ok ? MAX_SUGGESTIONS : 0;
    controller.remoteTimeout = data.remoteTimeout || undefined;
    let isPrivate = PrivateBrowsingUtils.isBrowserPrivate(browser);

    let suggestions;
    try {
      // If fetch() rejects due to it's asynchronous behaviour, the suggestions
      // are null and is then handled.
      suggestions = yield controller.fetch(data.searchString, isPrivate, engine);
    } catch (e) {
      Cu.reportError(e);
    }

    let result = null;
    if (suggestions) {
      this._suggestionMap.get(browser).previousFormHistoryResult = suggestions.formHistoryResult;
      result = {
        engineName: data.engineName,
        searchString: suggestions.term,
        formHistory: suggestions.local,
        suggestions: suggestions.remote,
      };
    }
    return result;
  }),

  /**
   *  Performs a search in the browser.
   */
  asyncPerformSearch: Task.async(function*(browser, data) {
    const engine = Services.search.getEngineByName(data.engineName);
    const submission = engine.getSubmission(data.searchString, "", data.searchPurpose);

    // The browser may have been closed between the time its content sent the
    // message and the time we handle it. In that case, trying to call any
    // method on it will throw.
    const browserWindow = browser.ownerDocument.defaultView;
    const whereToOpen = browserWindow.whereToOpenLink(data.originalEvent);

    // There is a chance that by the time we receive the search message, the user
    // has switched away from the tab that triggered the search. If, based on the
    // event, we need to load the search in the same tab that triggered it (i.e.
    // where === "current"), openUILinkIn will not work because that tab is no
    // longer the current one. For this case we manually load the URI.
    if (whereToOpen === "current") {
      browser.loadURIWithFlags(submission.uri.spec, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, submission.postData);
    } else {
      let params = {
        postData: submission.postData,
        inBackground: Services.prefs.getBoolPref("browser.tabs.loadInBackground"),
      };
      browserWindow.openUILinkIn(submission.uri.spec, whereToOpen, params);
    }
    yield this._asyncAddFormHistoryEntry(browser, data.searchString);
    return browserWindow;
  }),

  /**
   *  Add an entry to the form history - after a search happens.
   */
  _asyncAddFormHistoryEntry: Task.async(function*(browser, entry = "") {
    let {controller} = this._getSuggestionData(browser);
    let isPrivate = false;
    try {
      isPrivate = PrivateBrowsingUtils.isBrowserPrivate(browser);
    } catch (e) {
      // The browser might have already been destroyed.
      return false;
    }
    if (isPrivate || entry === "") {
      return false;
    }
    let result = yield new Promise((resolve, reject) => {
      const ops = {
        op: "bump",
        fieldname: controller.formHistoryParam,
        value: entry,
      };
      const callbacks = {
        handleCompletion: () => resolve(true),
        handleError: () => reject(),
      };
      FormHistory.update(ops, callbacks);
    });
    return result;
  }),

  /**
   *  Gets the suggestions data for the current browser.
   */
  _getSuggestionData(browser) {
    let data = this._suggestionMap.get(browser);
    if (!data) {
      // Since one SearchSuggestionController instance is meant to be used per
      // autocomplete widget, this means that we assume each xul:browser has at
      // most one such widget.
      data = {
        controller: new SearchSuggestionController(),
        previousFormHistoryResult: undefined,
      };
      this._suggestionMap.set(browser, data);
    }
    return data;
  },
};

exports.SearchProvider = {
  search:  new NewTabSearchProvider()
};
