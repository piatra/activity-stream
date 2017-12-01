/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

this.EXPORTED_SYMBOLS = ["Screenshots"];

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Console.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "BackgroundPageThumbs",
  "resource://gre/modules/BackgroundPageThumbs.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PageThumbs",
  "resource://gre/modules/PageThumbs.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PageThumbsStorage",
  "resource://gre/modules/PageThumbs.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "FileUtils",
    "resource://gre/modules/FileUtils.jsm");
XPCOMUtils.defineLazyServiceGetter(this, "MIMEService",
  "@mozilla.org/mime;1", "nsIMIMEService");
XPCOMUtils.defineLazyModuleGetter(this, "OS",
  "resource://gre/modules/osfile.jsm");

const GREY_10 = "#F9F9FA";

this.Screenshots = {
  /**
   * Convert bytes to a string using extremely fast String.fromCharCode without
   * exceeding the max number of arguments that can be provided to a function.
   */
  _bytesToString(bytes) {
    // NB: This comes from js/src/vm/ArgumentsObject.h ARGS_LENGTH_MAX
    const ARGS_LENGTH_MAX = 500 * 1000;
    let i = 0;
    let str = "";
    let {length} = bytes;
    while (i < length) {
      const start = i;
      i += ARGS_LENGTH_MAX;
      str += String.fromCharCode.apply(null, bytes.slice(start, i));
    }
    return str;
  },

  async getScreenshotForURL(url) {
    let screenshot = null;
    try {
      await BackgroundPageThumbs.captureIfMissing(url, {backgroundColor: GREY_10});
      const imgPath = PageThumbs.getThumbnailPath(url);

      // OS.File object used to easily read off-thread
      const file = await OS.File.open(imgPath, {read: true, existing: true});

      // nsIFile object needed for MIMEService
      const nsFile = FileUtils.File(imgPath);

      const contentType = MIMEService.getTypeFromFile(nsFile);
      const bytes = await file.read();
      const encodedData = btoa(this._bytesToString(bytes));
      file.close();
      screenshot = `data:${contentType};base64,${encodedData}`;
    } catch (err) {
      Cu.reportError(`getScreenshot error: ${err}`);
    }
    return screenshot;
  },

  /** Update image cache so that it will use the custom screenshot when
  * looking up the site url and remove the old screenshot.
  *
  * @param newScreenshotURL {string} URL pointing to the custom screenshot
  * @param url {string} Site url used to lookup the previous screenshot.
  */
  async replaceScreenshot(newScreenshotURL, url) {
    await PageThumbsStorage.remove(url);
    await PageThumbsStorage.copy(newScreenshotURL, url);
  },

  /**
   * Conditionally get a screenshot for a link if there's no existing pending
   * screenshot. Updates the cached link's desired property with the result.
   *
   * @param link {object} Link object to update
   * @param url {string} Url to get a screenshot of
   * @param property {string} Name of property on object to set
   * @param onScreenshot {function} Callback for when the screenshot loads
   * @param overwrite {bool} Force update the cache with the request result
   */
  async maybeCacheScreenshot(link, url, property, onScreenshot) {
    // Nothing to do if we already have a pending screenshot or
    // if a previous request failed and returned null.
    const cache = link.__sharedCache;
    if (cache.fetchingScreenshot || link[property] === null) {
      return;
    }

    // Save the promise to the cache so other links get it immediately
    cache.fetchingScreenshot = this.getScreenshotForURL(url);

    // Clean up now that we got the screenshot
    const screenshot = await cache.fetchingScreenshot;
    delete cache.fetchingScreenshot;

    // Update the cache for future links
    cache.updateLink(property, screenshot);
    // Call back for existing content
    onScreenshot(screenshot);
  }
};
