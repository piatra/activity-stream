const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
// const {actions} = require("common/action-manager");
// const classNames = require("classnames");
// const LinkMenu = require("components/LinkMenu/LinkMenu");
// const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
// const {PlaceholderSiteIcon, SiteIcon} = require("components/SiteIcon/SiteIcon");
// const {prettyUrl} = require("lib/utils");
const {injectIntl} = require("react-intl");
const {TOP_SITES_DEFAULT_LENGTH} = require("common/constants");

const BookmarkItem = React.createClass({
  getInitialState() {
    return {
      showContextMenu: false,
      activeTile: null,
      dragOver: false
    };
  },
  getDefaultProps() {
    return {
      onClick() {},
      onEdit() {},
      editMode: false
    };
  },
  render() {
    return <button>Bookmarks</button>;
  }
});

// XXX TODO
BookmarkItem.propTypes = {};

const PlaceholderBookmarks = React.createClass({
  render() {
    return <div>You have no bookmarks</div>;
  }
});

const Bookmarks = React.createClass({
  getDefaultProps() {
    return {
      length: TOP_SITES_DEFAULT_LENGTH,
      // This is for event reporting
      page: "NEW_TAB",
      allowEdit: true
    };
  },
  render() {
    let sites = this.props.Bookmarks.rows;
    console.log(sites);
    return (<div>
      <h2>Bookmarks section 123321</h2>
        {sites.map((site, i) =>
          <BookmarkItem index={i} key={i} />
        )}
      </div>);
  }
});

module.exports = connect(justDispatch)(injectIntl(Bookmarks));
module.exports.Bookmarks = Bookmarks;
module.exports.BookmarkItem = BookmarkItem;
module.exports.PlaceholderBookmarks = PlaceholderBookmarks;
