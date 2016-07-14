const React = require("react");
const {connect} = require("react-redux");
const {actions} = require("common/action-manager");

const FilteredActivity = React.createClass({
  render() {
    let bookmarks = this.props.filteredBookmarks;
    let pages = this.props.filteredPages;
    let tabs = this.props.filteredTabs;
    let history = this.props.filteredHistory;
    let bookmarkActivity = bookmarks && bookmarks.map((item) => {
            return <div className="activity">{item.url}</div>;
        });
    let historyActivity = history && history.map((item) => {
            return <div className="activity">{item.url}</div>;
        });
    return <div>{historyActivity}{bookmarkActivity}</div>;
  }
});

function select(state) {
  return state.FilteredActivity
}

module.exports = connect(select)(FilteredActivity);
