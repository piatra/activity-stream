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
    let device = this.props.device;
    let type = this.props.type;
    console.log(this.props);
    let urlsToShow = [];
    let params = new Map();
    params.set("type", type);
    params.set("device", device);
    switch(page) {
      case "Bookmarks":
        if (!bookmarks) {
          return;
        }
        if (type === "All" && device === "All") {
          console.log("bookmarks of all type and all devices");
          bookmarks.map(item => urlsToShow.push(item.url))
          break;
        }
        else if (type === "All") {
          console.log(`bookmarks of all type and devices ${device} `);
          bookmarks.forEach(item => {if (item.device === params.get("device")) urlsToShow.push(item.url)});
          break;
        }
         else if (device === "All") {
          console.log(`bookmarks of all devices and types ${type} `);
          bookmarks.forEach(item => {if (item.type === params.get("type")) urlsToShow.push(item.url)});
          break;
        } else {
          console.log(`bookmarks of type ${type} and devices ${device} `);
          bookmarks.forEach(item => {if (item.type === params.get("type") && item.device === params.get("device")) urlsToShow.push(item.url)});
          break;
        }
        break;
      case "History":
        if (!history) {
          return;
        }
        if (type === "All" && device === "All") {
          console.log("history of all type and all devices");
          console.log(history);
          history.map(item => urlsToShow.push(item.url))
          break;
        }
        else if (type === "All") {
          console.log(`history of all type and devices ${device} `);
          history.forEach(item => {if (item.device === params.get("device")) urlsToShow.push(item.url)});
          break;
        }
        else if (device === "All") {
          console.log(`history of all devices and types ${type} `);
          history.forEach(item => {if (item.type === params.get("type")) urlsToShow.push(item.url)});
          break;
        } else {
          console.log(`history of type ${type} and devices ${device} `)
          history.forEach(item => {if (item.type === params.get("type") && item.device === params.get("device")) urlsToShow.push(item.url)});
          break;
        }
        break;
      case "All":
      if (!history && bookmarks) {
        return;
      }
      if (type === "All" && device === "All") {
        history.concat(bookmarks).map(item => urlsToShow.push(item.url))
        break;
      }
      else if (type === "All") {
        history.concat(bookmarks).forEach(item => {if (item.device === params.get("device")) urlsToShow.push(item.url)});
        break;
      }
      else if (device === "All") {
        history.concat(bookmarks).forEach(item => {if (item.type === params.get("type")) urlsToShow.push(item.url)});
        break;
      } else {
        history.concat(bookmarks).forEach(item => {if (item.type === params.get("type") && item.device === params.get("device")) urlsToShow.push(item.url)});
        break;
      }
      break;
    }
    console.log(urlsToShow);
    return <div>{urlsToShow}</div>;
  }
});

function select(state) {
  return state.FilteredActivity;
}

module.exports = connect(select)(FilteredActivity);
