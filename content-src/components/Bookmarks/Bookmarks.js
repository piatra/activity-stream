const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const {actions} = require("common/action-manager");
const classNames = require("classnames");
// const LinkMenu = require("components/LinkMenu/LinkMenu");
// const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
// const {PlaceholderSiteIcon, SiteIcon} = require("components/SiteIcon/SiteIcon");
// const {prettyUrl} = require("lib/utils");
const {injectIntl} = require("react-intl");
// const {FormattedMessage} = require("react-intl");
const {SpotlightItem} = require("components/Spotlight/Spotlight");

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
    return <div className="bookmarks-placeholder">You don't have any bookmarks yet.</div>;
  }
});

const Bookmarks = React.createClass({
  getDefaultProps() {
    return {
      length: 3,
      page: "NEW_TAB",
      placeholder: false
    };
  },
  getInitialState() {
    return {isAnimating: false};
  },
  onClickFactory(index, site) {
    return () => {
      let payload = {
        event: "CLICK",
        page: this.props.page,
        source: "FEATURED",
        action_position: index,
        highlight_type: site.type,
        metadata_source: site.metadata_source
      };
      this.props.dispatch(actions.NotifyEvent(payload));
    };
  },
  // XXX factor out into a stateless component
  renderSiteList() {
    const sites = this.props.sites.filter(site => site.bookmarkGuid)
                                  .slice(0, this.props.length);

    return sites.map((site, i) =>
      <SpotlightItem
        index={i}
        key={site.guid || site.cache_key || i}
        page={this.props.page}
        source="FEATURED"
        onClick={this.onClickFactory(i, site)}
        dispatch={this.props.dispatch}
        {...site}
        prefs={this.props.prefs} />
    );
  },
  handleHeaderClick() {
    this.setState({isAnimating: true});
    this.props.dispatch(actions.NotifyPrefChange("collapseHighlights", !this.props.prefs.collapseHighlights));
  },
  handleTransitionEnd() {
    this.setState({isAnimating: false});
  },
  render() {
    const isCollapsed = this.props.prefs.collapseHighlights;
    const isAnimating = this.state.isAnimating;
    const sites = this.props.sites.filter(site => site.bookmarkGuid);

    return (<section className="spotlight">
      <h3 className="section-title" ref="section-title" onClick={this.handleHeaderClick}>
        Bookmarks
        <span className={classNames("icon", {"icon-arrowhead-down": !isCollapsed, "icon-arrowhead-up": isCollapsed})} />
      </h3>
      <ul ref="spotlight-list" className={classNames("spotlight-list", {"collapsed": isCollapsed, "animating": isAnimating})} onTransitionEnd={this.handleTransitionEnd}>
        {sites.length ? this.renderSiteList() : <PlaceholderBookmarks />}
      </ul>
    </section>);
  }
});

module.exports = connect(justDispatch)(injectIntl(Bookmarks));
module.exports.Bookmarks = Bookmarks;
module.exports.BookmarkItem = BookmarkItem;
module.exports.PlaceholderBookmarks = PlaceholderBookmarks;
