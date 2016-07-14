const React = require("react");
const {connect} = require("react-redux");
const {actions} = require("common/action-manager");

const FilteredActivity = React.createClass({
  render() {
    let bookmarks = this.props.filteredBookmarks;
    let pages = this.props.filteredPages;
    let tabs = this.props.filteredTabs;
    let history = this.props.filteredHistory;
    let page = this.props.page;
    console.log(this.props.page);
    let bookmarkActivity = page === "Bookmarks" && bookmarks && bookmarks.map((item) => {
      return <div className="activity">{item.url}</div>;
    });
    let historyActivity = page === "History" && history && history.map((item) => {
      return <div className="activity">{item.url}</div>;
    });
    let allActivity = page === "All" && history.concat(bookmarks).map((item) => {
      return <div className="activity">{item.url}</div>;
    });
    return <div>{allActivity}{historyActivity}{bookmarkActivity}</div>;
  }
});

function select(state) {
  return state.FilteredActivity;
}

module.exports = connect(select)(FilteredActivity);
