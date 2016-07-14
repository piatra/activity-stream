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
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  };
};
