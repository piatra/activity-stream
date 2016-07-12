/* globals NewTabURL, EventEmitter, XPCOMUtils, windowMediator, Task, Services */

"use strict";

const {Cu} = require("chrome");
const {data} = require("sdk/self");
const {PageMod} = require("sdk/page-mod");
const {setTimeout, clearTimeout} = require("sdk/timers");
const {ActionButton} = require("sdk/ui/button/action");
const tabs = require("sdk/tabs");
const simplePrefs = require("sdk/simple-prefs");
const privateBrowsing = require("sdk/private-browsing");
const windows = require("sdk/windows").browserWindows;
const prefService = require("sdk/preferences/service");
const ss = require("sdk/simple-storage");
const {Memoizer} = require("lib/Memoizer");
const {PlacesProvider} = require("lib/PlacesProvider");
const {SearchProvider} = require("lib/SearchProvider");
const {TabTracker} = require("lib/TabTracker");
const {PreviewProvider} = require("lib/PreviewProvider");
const {TelemetrySender} = require("lib/TelemetrySender");
const {FullTextSearchStore} = require("lib/FullTextSearch.js");
const {PerfMeter} = require("lib/PerfMeter");
const {AppURLHider} = require("lib/AppURLHider");
const am = require("common/action-manager");
const {CONTENT_TO_ADDON, ADDON_TO_CONTENT} = require("common/event-constants");
const {ExperimentProvider} = require("lib/ExperimentProvider");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/NewTabURL.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyServiceGetter(this, "windowMediator",
                                   "@mozilla.org/appshell/window-mediator;1",
                                   "nsIWindowMediator");

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", function() {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

const DEFAULT_OPTIONS = {
  pageURL: data.url("content/activity-streams.html"),
  onAddWorker: null,
  onRemoveWorker: null,
  previewCacheTimeout: 21600000, // every 6 hours, rebuild/repopulate the cache
  placesCacheTimeout: 1800000, // every 30 minutes, rebuild/repopulate the cache
};

const PLACES_CHANGES_EVENTS = [
  "deleteURI",
  "clearHistory",
  "linkChanged",
  "manyLinksChanged",
  "bookmarkAdded",
  "bookmarkRemoved",
  "bookmarkChanged"
];

const HOME_PAGE_PREF = "browser.startup.homepage";

function ActivityStreams(options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  EventEmitter.decorate(this);

  this._newTabURL = `${this.options.pageURL}#/`;

  this._setupPageMod();
  this._setupListeners();
  this._setupButton();
  NewTabURL.override(this._newTabURL);
  this._setHomePage();

  Services.prefs.setIntPref("places.favicons.optimizeToDimension", 64);

  this._appURLHider = new AppURLHider(this.appURLs);
  this._perfMeter = new PerfMeter(this.appURLs);

  this._memoizer = new Memoizer();
  this._memoized = this._get_memoized(this._memoizer);

  this._telemetrySender = new TelemetrySender();

  this._experimentProvider = new ExperimentProvider(
    options.clientID,
    options.experiments,
    options.rng
  );

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
    let pages = yield this._fullTextSearchStore.asyncExecuteQuery(
      "SELECT * FROM fts_pages WHERE fts_pages MATCH 'information OR retrieval'");
    console.log("==== Raw search fetched: ", pages);
    let prefixPages = yield this._fullTextSearchStore.asyncMatchPrefix("database");
    console.log("==== Search prefix fetched: ", prefixPages);
    let exactPages = yield this._fullTextSearchStore.asyncMatchExact("Mozilla Firefox");
    console.log("==== Search exact fetched: ", exactPages);
  }.bind(this));

  this._tabTracker = new TabTracker(
    this.appURLs,
    options.clientID,
    this._memoized,
    this._experimentProvider.experimentId
  );

  this._previewProvider = new PreviewProvider(this._tabTracker);
  this._populatingCache = {
    places: false,
    preview: false,
  };

  this._asyncBuildPlacesCache();

  this._asyncBuildPreviewCache();
  this._startPeriodicBuildPreviewCache(this.options.previewCacheTimeout);
}

ActivityStreams.prototype = {

  _pagemod: null,
  _button: null,
  _previewCacheTimeoutID: null,

  /**
   * Send a message to a worker
   */
  send(action, worker) {
    // if the function is async, the worker might not be there yet, or might have already disappeared
    try {
      worker.port.emit(ADDON_TO_CONTENT, action);
      this._perfMeter.log(worker.tab, action.type);
    } catch (err) {
      this.workers.delete(worker);
      Cu.reportError(err);
    }
  },

  /**
   * Broadcast a message to all workers
   */
  broadcast(action) {
    for (let worker of this.workers) {
      this.send(action, worker);
    }
  },

  _respondOpenWindow({msg}) {
    if (msg.type === am.type("NOTIFY_OPEN_WINDOW")) {
      windows.open({
        url: msg.data.url,
        isPrivate: msg.data.isPrivate
      });
    }
  },

  /**
   * Responds to places requests
   */
  _respondToPlacesRequests({msg, worker}) {
    let provider = this._memoized;
    if (msg.data && (msg.data.afterDate || msg.data.beforeDate)) {
      // Only use the Memoizer cache for the default first page of data.
      provider = PlacesProvider.links;
    }
    switch (msg.type) {
      case am.type("TOP_FRECENT_SITES_REQUEST"):
        provider.getTopFrecentSites(msg.data).then(links => {
          this._processAndSendLinks(links, "TOP_FRECENT_SITES_RESPONSE", worker, msg.meta);
        });
        break;
      case am.type("RECENT_BOOKMARKS_REQUEST"):
        provider.getRecentBookmarks(msg.data).then(links => {
          this._processAndSendLinks(links, "RECENT_BOOKMARKS_RESPONSE", worker, msg.meta);
        });
        break;
      case am.type("RECENT_LINKS_REQUEST"):
        provider.getRecentLinks(msg.data).then(links => {
          this._processAndSendLinks(links, "RECENT_LINKS_RESPONSE", worker, msg.meta);
        });
        break;
      case am.type("HIGHLIGHTS_LINKS_REQUEST"):
        provider.getHighlightsLinks(msg.data).then(links => {
          this._processAndSendLinks(links, "HIGHLIGHTS_LINKS_RESPONSE", worker, msg.meta);
        });
        break;
      case am.type("NOTIFY_BOOKMARK_ADD"):
        PlacesProvider.links.asyncAddBookmark(msg.data);
        break;
      case am.type("NOTIFY_BOOKMARK_DELETE"):
        PlacesProvider.links.asyncDeleteBookmark(msg.data);
        break;
      case am.type("NOTIFY_HISTORY_DELETE"):
        PlacesProvider.links.deleteHistoryLink(msg.data);
        break;
      case am.type("NOTIFY_BLOCK_URL"):
        PlacesProvider.links.blockURL(msg.data);
        break;
      case am.type("NOTIFY_UNBLOCK_URL"):
        PlacesProvider.links.unblockURL(msg.data);
        break;
      case am.type("NOTIFY_UNBLOCK_ALL"):
        PlacesProvider.links.unblockAll();
        break;
    }
  },

  /*
   * Process the passed in links, save them, get from cache and response to content.
   */
  _processAndSendLinks(placesLinks, responseType, worker, options) {
    let {append, previewsOnly, skipPreviewRequest} = options || {};
    const event = this._tabTracker.generateEvent({source: responseType});
    const cachedLinks = this._previewProvider.getLinkMetadata(placesLinks, event, skipPreviewRequest, previewsOnly);
    cachedLinks.then(linksToSend => this.send(am.actions.Response(responseType, linksToSend, {append}), worker));
  },

  /**
   * Responds to search requests
   */
  _respondToSearchRequests({msg, worker}) {
    const win = windowMediator.getMostRecentWindow("navigator:browser");
    const gBrowser = win.getBrowser();
    const browser = gBrowser.selectedBrowser;
    switch (msg.type) {
      case am.type("FILTER_REQUEST"):
        let filteredActivity = SearchProvider.search.getFilteredActivity(msg.data);
        console.log("FILTERED STUFF: " + JSON.stringify(filteredActivity));
        this.send(am.actions.Response("FILTER_RESPONSE", {filteredActivity}), worker);
        break;
      case am.type("SEARCH_STATE_REQUEST"):
        SearchProvider.search.asyncGetCurrentState().then(state => {
          let currentEngine = JSON.stringify(state.currentEngine);
          state.currentEngine = currentEngine;
          this.send(am.actions.Response("SEARCH_STATE_RESPONSE", state), worker);
        });
        break;
      case am.type("NOTIFY_PERFORM_SEARCH"):
        SearchProvider.search.asyncPerformSearch(browser, msg.data);
        break;
      case am.type("SEARCH_UISTRINGS_REQUEST"): {
        const strings = SearchProvider.search.searchSuggestionUIStrings;
        this.send(am.actions.Response("SEARCH_UISTRINGS_RESPONSE", strings), worker);
        break;
      }
      case am.type("SEARCH_SUGGESTIONS_REQUEST"):
        Task.spawn(function*() {
          try {
            const suggestions = yield SearchProvider.search.asyncGetSuggestions(browser, msg.data);
            if (suggestions) {
              this.send(am.actions.Response("SEARCH_SUGGESTIONS_RESPONSE", suggestions), worker);
            }
          } catch (e) {
            Cu.reportError(e);
          }
        }.bind(this));
        break;
      case am.type("NOTIFY_REMOVE_FORM_HISTORY_ENTRY"): {
        let entry = msg.data;
        SearchProvider.search.removeFormHistoryEntry(browser, entry);
        break;
      }
      case am.type("NOTIFY_MANAGE_ENGINES"):
        SearchProvider.search.manageEngines(browser);
        break;
      case am.type("SEARCH_CYCLE_CURRENT_ENGINE_REQUEST"): {
        SearchProvider.search.cycleCurrentEngine(msg.data);
        let engine = SearchProvider.search.currentEngine;
        this.send(am.actions.Response("SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE", {currentEngine: engine}), worker);
        break;
      }
    }
  },

  _respondToExperimentsRequest({worker}) {
    this.send(am.actions.Response("EXPERIMENTS_RESPONSE", this._experimentProvider.data), worker);
  },

  /**
   * Handles changes to places
   */
  _handlePlacesChanges(eventName, data) {

    /* note: this will execute for each of the 3 notifications that occur
     * when adding a visit: frecency:-1, frecency: real frecency, title */
    if (this._populatingCache && !this._populatingCache.places) {
      this._asyncBuildPlacesCache();
    }

    if (eventName.startsWith("bookmark")) {
      this.broadcast(am.actions.Response("RECEIVE_BOOKMARKS_CHANGES", data));
    } else {
      this.broadcast(am.actions.Response("RECEIVE_PLACES_CHANGES", data));
    }
  },

  /*
   * Broadcast current engine has changed to all open newtab pages
   */
  _handleCurrentEngineChanges(eventName, data) {
    this.broadcast(am.actions.Response("RECEIVE_CURRENT_ENGINE"), data);
  },

  _handleUserEvent({msg}) {
    this._tabTracker.handleUserEvent(msg.data);
  },

  _onRouteChange({msg} = {}) {
    if (msg) {
      this._tabTracker.handleRouteChange(tabs.activeTab, msg.data);
    }
    this._appURLHider.maybeHideURL(tabs.activeTab);
  },

  _respondToUIChanges(args) {
    const {msg} = args;
    switch (msg.type) {
      case am.type("NOTIFY_ROUTE_CHANGE"):
        return this._onRouteChange(args);
      case am.type("NOTIFY_USER_EVENT"):
        return this._handleUserEvent(args);
      case am.type("EXPERIMENTS_REQUEST"):
        return this._respondToExperimentsRequest(args);
    }
  },

  _logPerfMeter({msg, worker}) {
    this._perfMeter.log(worker.tab, msg.type, msg.data);
  },

  /**
   * Sets up various listeners for the pages
   */
  _setupListeners() {
    this._handlePlacesChanges = this._handlePlacesChanges.bind(this);
    PLACES_CHANGES_EVENTS.forEach(event => PlacesProvider.links.on(event, this._handlePlacesChanges));

    this._handleCurrentEngineChanges = this._handleCurrentEngineChanges.bind(this);
    SearchProvider.search.on("browser-search-engine-modified", this._handleCurrentEngineChanges);

    // This is a collection of handlers that receive messages from content
    this._contentToAddonHandlers = (msgName, args) => {
      this._respondToUIChanges(args);
      this._respondToPlacesRequests(args);
      this._respondToSearchRequests(args);
      this._logPerfMeter(args);
      this._respondOpenWindow(args);
    };
    this.on(CONTENT_TO_ADDON, this._contentToAddonHandlers);
  },

  /**
   * Turns off various listeners for the pages
   */
  _removeListeners() {
    PLACES_CHANGES_EVENTS.forEach(event => PlacesProvider.links.off(event, this._handlePlacesChanges));
    SearchProvider.search.off("browser-search-engine-modified", this._handleCurrentEngineChanges);
    this.off(CONTENT_TO_ADDON, this._contentToAddonHandlers);
  },

  /**
   * Returns an object of functions with results cached
   */
  _get_memoized(cache) {
    let linksObj = PlacesProvider.links;
    return {
      getTopFrecentSites: cache.memoize("getTopFrecentSites", PlacesProvider.links.getTopFrecentSites.bind(linksObj)),
      getRecentBookmarks: cache.memoize("getRecentBookmarks", PlacesProvider.links.getRecentBookmarks.bind(linksObj)),
      getRecentLinks: cache.memoize("getRecentLinks", PlacesProvider.links.getRecentLinks.bind(linksObj)),
      getHighlightsLinks: cache.memoize("getHighlightsLinks", PlacesProvider.links.getHighlightsLinks.bind(linksObj)),
      getHistorySize: cache.memoize("getHistorySize", PlacesProvider.links.getHistorySize.bind(linksObj)),
      getBookmarksSize: cache.memoize("getBookmarksSize", PlacesProvider.links.getBookmarksSize.bind(linksObj)),
    };
  },

  /**
   * Builds a places pageload cache
   *
   * Requires this._memoized to have been initialized.
   */
  _asyncBuildPlacesCache: Task.async(function*() {
    if (simplePrefs.prefs["query.cache"]) {
      if (this._populatingCache && !this._populatingCache.places) {
        this._populatingCache.places = true;
        let opt = {replace: true};
        yield Promise.all([
            this._memoized.getTopFrecentSites(opt),
            this._memoized.getRecentBookmarks(opt),
            this._memoized.getRecentLinks(opt),
            this._memoized.getHighlightsLinks(opt),
            this._memoized.getHistorySize(opt),
            this._memoized.getBookmarksSize(opt),
        ]);
        this._populatingCache.places = false;
        Services.obs.notifyObservers(null, "activity-streams-places-cache-complete", null);
      }

      // Call myself when cache expires to repopulate.
      // This is needed because some of the queries are time dependent (for example,
      // highlights excludes links from the past 30 minutes).
      if (this._placesCacheTimeoutID) {
        clearTimeout(this._placesCacheTimeoutID);
      }
      this._placesCacheTimeoutID = setTimeout(() => {
        this._asyncBuildPlacesCache();
      }, this.options.placesCacheTimeout);
    }
  }),

  /**
   * Builds a preview cache with links from a normal content page load
   */
  _asyncBuildPreviewCache: Task.async(function*() {
    if (this._populatingCache && !this._populatingCache.preview) {
      this._populatingCache.preview = true;
      let placesLinks = [];
      let promises = [];

      promises.push(PlacesProvider.links.getTopFrecentSites().then(links => {
        placesLinks.push(...links);
      }));

      promises.push(PlacesProvider.links.getRecentBookmarks().then(links => {
        placesLinks.push(...links);
      }));

      promises.push(PlacesProvider.links.getRecentLinks().then(links => {
        placesLinks.push(...links);
      }));

      promises.push(PlacesProvider.links.getHighlightsLinks().then(links => {
        placesLinks.push(...links);
      }));

      yield Promise.all(promises);
      const event = this._tabTracker.generateEvent({source: "BUILD_PREVIEW_CACHE"});
      yield this._previewProvider.asyncBuildCache(placesLinks, event);
      this._populatingCache.preview = false;
      Services.obs.notifyObservers(null, "activity-streams-previews-cache-complete", null);
    }
  }),

  /**
   * Set up preview cache to be repopulated every 6 hours
   */
  _startPeriodicBuildPreviewCache(previewCacheTimeout) {
    if (previewCacheTimeout) {
      // only set a timeout if a non-null value is provided otherwise this will
      // effectively be an infinite loop
      this._previewCacheTimeoutID = setTimeout(() => {
        this._asyncBuildPreviewCache();
        this._startPeriodicBuildPreviewCache(previewCacheTimeout);
      }, previewCacheTimeout);
    }
  },

  /**
   * Sets up communications with the pages and manages the lifecycle of workers
   */
  _setupPageMod() {
    // `this` here refers to the object instance
    this.workers = new Set();
    this._pagemod = new PageMod({
      include: [this.options.pageURL + "*"],
      contentScriptFile: data.url("content-bridge.js"),
      contentScriptWhen: "start",
      attachTo: ["existing", "top"],
      onAttach: worker => {

        // Don't attach when in private browsing. Send user to about:privatebrowsing
        if (privateBrowsing.isPrivate(worker)) {
          worker.tab.url = "about:privatebrowsing";
          return;
        }

        // This detaches workers on reload or closing the tab
        worker.on("detach", () => this._removeWorker(worker));

        // add the worker to a set to enable broadcasting
        if (!this.workers.has(worker)) {
          this._addWorker(worker);
        }

        worker.port.on(CONTENT_TO_ADDON, msg => {
          if (!msg.type) {
            Cu.reportError("ActivityStreams.dispatch error: unknown message type");
            return;
          }
          // This detaches workers if a new url is launched
          // it is important to remove the worker from the set, otherwise we will leak memory
          if (msg.type === "pagehide") {
            this._removeWorker(worker);
          }
          this.emit(CONTENT_TO_ADDON, {msg, worker});
        });
      },
      onError: err => {
        Cu.reportError(err);
      }
    });
  },

  /**
   * Adds a worker and calls callback if defined
   */
  _addWorker(worker) {
    this._perfMeter.log(worker.tab, "WORKER_ATTACHED");
    this.workers.add(worker);
    if (this.options.onAddWorker) {
      this.options.onAddWorker();
    }
  },

  /**
   * Removes a worker and calls callback if defined
   */
  _removeWorker(worker) {
    this.workers.delete(worker);
    if (this.options.onRemoveWorker) {
      this.options.onRemoveWorker();
    }
  },

  _setupButton() {
    this._button = ActionButton({
      id: "activity-streams-link",
      label: "Activity Stream",
      icon: data.url("content/img/list-icon.svg"),
      onClick: () => tabs.open(`${this.options.pageURL}#/timeline`)
    });
  },

  /*
   * Replace the home page with the ActivityStream new tab page.
   */
  _setHomePage() {
    // Only hijack the home page if it isn't set by user or if it is set to
    // about:home/about:blank
    // AND the user didn't previously override the preference.
    if (!ss.storage.homepageOverriden &&
        (!prefService.isSet(HOME_PAGE_PREF) ||
         ["about:home", "about:blank"].includes(prefService.get(HOME_PAGE_PREF)))) {
      prefService.set(HOME_PAGE_PREF, this._newTabURL);
    }
  },

  _unsetHomePage() {
    if (prefService.get(HOME_PAGE_PREF) === this._newTabURL) {
      // Reset home page back if user didn't change it.
      prefService.reset(HOME_PAGE_PREF);
    } else {
      // The user changed the pref. Keep track of that so next time we don't
      // hijack it again.
      ss.storage.homepageOverriden = true;
    }
  },

  /**
   * The URLs for the app.
   */
  get appURLs() {
    if (!this._appURLs) {
      let baseUrl = this.options.pageURL;
      this._appURLs = [
        baseUrl,
        `${baseUrl}#/`,
        `${baseUrl}#/timeline`,
        `${baseUrl}#/timeline/bookmarks`
      ];
    }
    return this._appURLs;
  },

  get tabData() {
    return this._tabTracker.tabData;
  },

  get performanceData() {
    return this._perfMeter.events;
  },

  /**
   * Unload the application
   */
  unload(reason) { // eslint-disable-line no-unused-vars
    let defaultUnload = () => {
      clearTimeout(this._previewCacheTimeoutID);
      clearTimeout(this._placesCacheTimeoutID);
      this._previewProvider.uninit();
      NewTabURL.reset();
      Services.prefs.clearUserPref("places.favicons.optimizeToDimension");
      this.workers.clear();
      this._removeListeners();
      this._pagemod.destroy();
      this._button.destroy();
      this._tabTracker.uninit();
      this._telemetrySender.uninit();
      this._fullTextSearchStore.asyncClose();
      this._appURLHider.uninit();
      this._perfMeter.uninit();
      this._memoizer.uninit();
      this._populatingCache = {
        places: false,
        preview: false,
      };
    };

    switch (reason){
      // can be one of: uninstall/disable/shutdown/upgrade/downgrade
      case "disable":
      case "uninstall":
        this._tabTracker.handleUserEvent({event: reason});
        this._previewProvider.clearCache();
        this._unsetHomePage();
        defaultUnload();
        break;
      default:
        defaultUnload();
    }
  }
};

exports.ActivityStreams = ActivityStreams;
