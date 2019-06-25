/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

ChromeUtils.defineModuleGetter(this, "Services",
  "resource://gre/modules/Services.jsm");

class _ToolbarBadgeHub {
  constructor() {
    this.id = "toolbar-badge-hub";
    this.removeToolbarNotification = this.removeToolbarNotification.bind(this);
  }

  init(handleMessageRequest, {hasBeenUpgraded}) {
    this._handleMessageRequest = handleMessageRequest;
    this.messageRequest(hasBeenUpgraded ? "firstRunAfterUpgrade" : "firstRun");
  }

  uninit() {
    // noop
  }

  async messageRequest(triggerId) {
    const browserWindow = Services.wm.getMostRecentBrowserWindow();
    const message = await this._handleMessageRequest({triggerId, template: "badge"});
    this.addBadge(browserWindow, message);
  }

  onAction({action}) {
    switch (action.id) {
      case "showWhatsNewButton":
        // call ToolbarPanelHub.showButton()
        break;
      default:
        // unknown action
    }
  }

  addBadge(target, message, options) {
    if (message) {
      const document = target.browser.ownerDocument;
      let toolbarbutton = document.getElementById(message.content.target);
      if (toolbarbutton) {
        toolbarbutton.setAttribute("badged", true);
        toolbarbutton.querySelector(".toolbarbutton-badge").setAttribute("value", "x");

        toolbarbutton.addEventListener("click", this.removeToolbarNotification, {once: true});
      }
      if (message.content.action) {
        this.onAction(message.content);
      }
    }
  }

  removeToolbarNotification(event) {
    event.target.querySelector(".toolbarbutton-badge").removeAttribute("value");
    event.target.removeAttribute("badged");
  }
}

this._ToolbarBadgeHub = _ToolbarBadgeHub;

/**
 * ToolbarBadgeHub - singleton instance of _ToolbarBadgeHub that can initiate
 * message requests and render messages.
 */
this.ToolbarBadgeHub = new _ToolbarBadgeHub();

const EXPORTED_SYMBOLS = ["ToolbarBadgeHub", "_ToolbarBadgeHub"];
