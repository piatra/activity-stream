/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const TWO_DAYS = 2 * 24 * 3600 * 1000;

const MESSAGES = () => [
  {
    id: "SIMPLE_FXA_BOOKMARK_TEST_FLUENT",
    template: "fxa_bookmark_panel",
    content: {
      title: { string_id: "cfr-doorhanger-bookmark-fxa-header" },
      text: { string_id: "cfr-doorhanger-bookmark-fxa-body" },
      cta: { string_id: "cfr-doorhanger-bookmark-fxa-link-text" },
      color: "white",
      background_color_1: "#7d31ae",
      background_color_2: "#5033be",
      info_icon: {
        tooltiptext: {
          string_id: "cfr-doorhanger-bookmark-fxa-info-icon-tooltip",
        },
      },
      close_button: {
        tooltiptext: {
          string_id: "cfr-doorhanger-bookmark-fxa-close-btn-tooltip",
        },
      },
    },
    trigger: { id: "bookmark-panel" },
  },
  {
    id: "SIMPLE_FXA_BOOKMARK_TEST_NON_FLUENT",
    template: "fxa_bookmark_panel",
    content: {
      title: "Bookmark Message Title",
      text: "Bookmark Message Body",
      cta: "Sync bookmarks now",
      color: "white",
      background_color_1: "#7d31ae",
      background_color_2: "#5033be",
      info_icon: {
        tooltiptext: "Toggle tooltip",
      },
      close_button: {
        tooltiptext: "Close tooltip",
      },
    },
    trigger: { id: "bookmark-panel" },
  },
  {
    id: "WNP_THANK_YOU",
    template: "update_action",
    content: {
      action: {
        id: "moments-wnp",
        data: {
          url:
            "https://www.mozilla.org/%LOCALE%/etc/firefox/retention/thank-you-a/",
          expireDelta: TWO_DAYS,
        },
      },
    },
    trigger: { id: "momentsUpdate" },
  },
  {
    id: "WHATS_NEW_70_1",
    template: "whatsnew_panel_message",
    order: 3,
    content: {
      published_date: 1560969794394,
      title: "Protection Is Our Focus",
      icon_url:
        "resource://activity-stream/data/content/assets/whatsnew-send-icon.png",
      icon_alt: "Firefox Send Logo",
      body:
        "The New Enhanced Tracking Protection, gives you the best level of protection and performance. Discover how this version is the safest version of firefox ever made.",
      cta_url: "https://blog.mozilla.org/",
      cta_type: "OPEN_URL",
    },
    targeting: `firefoxVersion > 69`,
    trigger: { id: "whatsNewPanelOpened" },
  },
  {
    id: "WHATS_NEW_70_2",
    template: "whatsnew_panel_message",
    order: 1,
    content: {
      published_date: 1560969794394,
      title: "Another thing new in Firefox 70",
      body:
        "The New Enhanced Tracking Protection, gives you the best level of protection and performance. Discover how this version is the safest version of firefox ever made.",
      link_text: "Learn more on our blog",
      cta_url: "https://blog.mozilla.org/",
      cta_type: "OPEN_URL",
    },
    targeting: `firefoxVersion > 69`,
    trigger: { id: "whatsNewPanelOpened" },
  },
  {
    id: "WHATS_NEW_69_1",
    template: "whatsnew_panel_message",
    order: 1,
    content: {
      published_date: 1557346235089,
      title: "Something new in Firefox 69",
      body:
        "The New Enhanced Tracking Protection, gives you the best level of protection and performance. Discover how this version is the safest version of firefox ever made.",
      link_text: "Learn more on our blog",
      cta_url: "https://blog.mozilla.org/",
      cta_type: "OPEN_URL",
    },
    targeting: `firefoxVersion > 68`,
    trigger: { id: "whatsNewPanelOpened" },
  },
  {
<<<<<<< HEAD
    id: "WHATS_NEW_70_3",
    template: "whatsnew_panel_message",
    order: 2,
    content: {
      published_date: 1560969794394,
      layout: "tracking-protections",
      title: { string_id: "cfr-whatsnew-tracking-blocked-title" },
      subtitle: { string_id: "cfr-whatsnew-tracking-blocked-subtitle" },
      icon_url:
        "resource://activity-stream/data/content/assets/protection-report-icon.png",
      icon_alt: "Protection Report icon",
      body: { string_id: "cfr-whatsnew-tracking-protect-body" },
      link_text: { string_id: "cfr-whatsnew-tracking-blocked-link-text" },
      cta_url: "protections",
      cta_type: "OPEN_ABOUT_PAGE",
    },
    targeting: `firefoxVersion > 69 && totalBlockedCount > 0`,
    trigger: { id: "whatsNewPanelOpened" },
=======
    id: "BOOKMARK_CFR",
    template: "cfr_doorhanger",
    content: {
      category: "cfrAddons",
      bucket_id: "CFR_M1",
      notification_text: { string_id: "cfr-doorhanger-extension-notification" },
      heading_text: { string_id: "cfr-doorhanger-extension-heading" },
      info_icon: {
        label: { string_id: "cfr-doorhanger-extension-sumo-link" },
        sumo_path: "https://example.com",
      },
      addon: {
        id: "954390",
        title: "Bookmark CFR",
        icon:
          "resource://activity-stream/data/content/assets/cfr_fb_container.png",
        rating: 4.6,
        users: 299019,
        author: "Mozilla",
        amo_url: "https://addons.mozilla.org/firefox/addon/facebook-container/",
      },
      text:
        "Stop Facebook from tracking your activity across the web. Use Facebook the way you normally do without annoying ads following you around.",
      buttons: {
        primary: {
          label: { string_id: "cfr-doorhanger-extension-ok-button" },
          action: {
            type: "INSTALL_ADDON_FROM_URL",
            data: { url: null },
          },
        },
        secondary: [
          {
            label: { string_id: "cfr-doorhanger-extension-cancel-button" },
            action: { type: "CANCEL" },
          },
          {
            label: {
              string_id: "cfr-doorhanger-extension-never-show-recommendation",
            },
          },
          {
            label: {
              string_id: "cfr-doorhanger-extension-manage-settings-button",
            },
            action: {
              type: "OPEN_PREFERENCES_PAGE",
              data: { category: "general-cfraddons" },
            },
          },
        ],
      },
    },
    frequency: { lifetime: 3 },
    targeting: `true`,
    trigger: {
      id: "openURL",
      patterns: ["*://*/*"],
    },
>>>>>>> 085e0b26... Reuse the work from the previous triggers attempt
  },
];

const PanelTestProvider = {
  getMessages() {
    return MESSAGES().map(message => ({
      ...message,
      targeting: `providerCohorts.panel_local_testing == "SHOW_TEST"`,
    }));
  },
};
this.PanelTestProvider = PanelTestProvider;

const EXPORTED_SYMBOLS = ["PanelTestProvider"];
