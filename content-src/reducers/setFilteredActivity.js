const am = require("common/action-manager");

const DEFAULTS = {
  results: [],
  error: false,
  isLoading: false,
};

module.exports = function setFilteredActivity() {
  return (prevState = DEFAULTS, action) => {
    const state = {};
    switch (action.type) {
      case am.type("FILTER_REQUEST"):
        state.isLoading = true;
        break;
      case am.type("FILTER_RESPONSE"):
        state.isLoading = false;
        if (action.error) {
          state.results = [];
          state.error = action.data;
        } else {
          state.results = action.data.activity;
          state.error = false;
        }
        break;
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  };
};
