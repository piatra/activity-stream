/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

class _ToolbarBadgeHub {
  constructor() {
    this.id = "toolbar-badge-hub";
  }

  init() {
    this.state = {notification: null};
  }

  uninit() {
    this.state = {};
    this.removeToolbarNotification();
  }

  showToolbarNotification(document, message, options) {
    if (!this.state.notification) {
      let toolbarbutton = document.getElementById(message.target);
      toolbarbutton.setAttribute("badged", true);
      toolbarbutton.querySelector(".toolbarbutton-badge").setAttribute("value", "x");

      this.state.notification = toolbarbutton;
    }
  }

  removeToolbarNotification() {
    if (this.state.notification) {
      this.state.notification.remove();
    }
  }
}

this._ToolbarPanelHub = _ToolbarPanelHub;

/**
 * ToolbarPanelHub - singleton instance of _ToolbarPanelHub that can initiate
 * message requests and render messages.
 */
this.ToolbarBadgeHub = new _ToolbarBadgeHub();

const EXPORTED_SYMBOLS = ["ToolbarBadgeHub", "_ToolbarBadgeHub"];
