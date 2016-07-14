const FTSRawPages = [{
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
},
{
  url: "https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/places_history",
  title: "places/history - Mozilla | MDN",
  description: "",
  type: "html",
  last_visit: "2016-07-09 14:17:50",
  body: `Access the user's browsing history.

  This module exports a single function, search(), which synchronously returns a PlacesEmitter object which then asynchronously emits data and end or error events that contain information about the state of the operation.

  Functions
  search(queries, options)

  Queries can be performed on history entries by passing in one or more query options. Each query option can take several properties, which are AND'd together to make one complete query. For additional queries within the query, passing more query options in will OR the total results. An options object may be specified to determine overall settings, like sorting and how many objects should be returned.
  Parameters

  queries : object|array
  An Object representing a query, or an Array of Objects representing queries. Each query object can take several properties, which are queried against the history database. Each property is AND'd together, meaning that bookmarks must match each property within a query object. Multiple query objects are then OR'd together.

    options : object
  Optional options:

  PlacesEmitter

  The PlacesEmitter is not exposed in the module, but returned from the search functions. The PlacesEmitter inherits from event/target, and emits data, error, and end. data events are emitted for every individual search result found, whereas end events are emitted as an aggregate of an entire search, passing in an array of all results into the handler.`
},
{
  url: "https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/places_bookmarks",
  title: "places/bookmarks - Mozilla | MDN",
  description: "",
  type: "html",
  last_visit: "2016-07-09 14:31:50",
  body: `Create, modify, and retrieve bookmarks.
  Usage

  This module exports:

  three constructors: Bookmark, Group, and Separator, corresponding to the types of objects, referred to as bookmark items, in the Bookmarks database in Firefox
      two additional functions, save() to create, update, and remove bookmark items, and search() to retrieve the bookmark items that match a particular set of criteria.

  save() and search() are both asynchronous functions: they synchronously return a PlacesEmitter object, which then asynchronously emits events as the operation progresses and completes.

  Each retrieved bookmark item represents only a snapshot of state at a specific time. The module does not automatically sync up a Bookmark instance with ongoing changes to that item in the database from the same add-on, other add-ons, or the user.`
},
{
  url: "https://www.youtube.com/watch?v=lDv68xYHFXM",
  title: "Firefox Test Pilot: Suit up and take experimental features for a test flight - YouTube",
  description: "",
  type: "video",
  last_visit: "2016-07-14 10:17:18",
  body: "Be the first to try experimental Firefox features. Join Test Pilot to unlock access to our rainbow launchers, teleportation devices, security sphinxes, invisibility cloaks – all our best ideas for making the Internet more awesome. All you have to do is play around and let us know what to launch, what to tune up, and what gets the ejection seat. Grab your parachute and go for a spin at testpilot.firefox.com."
},
{
  url: "https://www.youtube.com/watch?v=dgteUNwOVaU",
  title: "Firefox for Android will rock your World Wide Web - YouTube",
  description: "",
  type: "video",
  last_visit: "2016-07-14 10:20:18",
  body: "Do you have an Android phone? Firefox for Android will rock your World Wide Web. Download it for free from the Google Play Store by clicking here: http://mzl.la/1qx7Cav."
},
{
  url: "https://www.youtube.com/watch?v=7I5bSq2wQK4",
  title: "The Toronto Blue Jays - 2015 Full Season Highlights - YouTube",
  description: "",
  type: "video",
  last_visit: "2016-07-14 10:23:18",
  body: `93 Wins, 2 11-game winstreaks, AL East Pennant, AL Division Champs

  Truly a wonderful season to watch, by far the best season I've ever experienced, and I can only hope for more next year!

  Thanks for watching all year :)`
},
{
  url: "https://www.youtube.com/watch?v=imRhlUpE36Y",
  title: "TEX@TOR Game 5: Blue Jays take lead in a wild 7th inning - YouTube",
  description: "",
  type: "video",
  last_visit: "2016-07-14 10:27:18",
  body: `10/14/15: The Blue Jays turn a deficit into a three-run lead in a wild 7th that includes three errors, a homer and benches emptying

  Check out http://m.mlb.com/video for our full archive of videos, and subscribe on YouTube for the best, exclusive MLB content: http://youtube.com/MLB`
}
];

exports.FTSRawPages = FTSRawPages;
