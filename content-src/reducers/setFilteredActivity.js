const am = require("common/action-manager");

const DEFAULTS = {
  filteredActivity: [],
  error: false,
  isLoading: false,
};

module.exports = function FilteredActivity() {
  return (prevState = DEFAULTS, action) => {
    const state = {};
    switch (action.type) {
      case am.type("FILTER_REQUEST"):
        state.isLoading = true;
        break;
      case am.type("FILTER_RESPONSE"):
        state.isLoading = false;
        if (action.error) {
          state.filteredActivity = [];
          state.error = action.data;
        } else {
          state.filteredBookmarks = action.data.activity.bookmarks;
          state.filteredHistory = action.data.activity.history;
          state.filteredPages = action.data.activity.pages;
          state.filteredTabs = action.data.activity.tabs;
          state.error = false;
        }
        break;
      case am.type("NOTIFY_SHOW_FILTERED_PAGE"):
        state.page = action.data.page || prevState.page;
        state.type = action.data.type || prevState.type;
        state.device = action.data.device || prevState.device;
        break;
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  };
};
