const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const getHighlightContextFromSite = require("selectors/getHighlightContextFromSite");
const {actions} = require("common/action-manager");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const HighlightContext = require("components/HighlightContext/HighlightContext");
const classNames = require("classnames");
const {prettyUrl, getRandomFromTimestamp} = require("lib/utils");
const moment = require("moment");

const ICON_SIZE = 16;
const TOP_LEFT_ICON_SIZE = 20;

class SpotlightFeedItem extends React.Component {
  _updateWeights(index) {
    return () => {
      this.props.dispatch(actions.NotifyUpdateWeights(index));

      this.props.dispatch(actions.NotifyEvent({
        event: "CLICK",
        page: "NEW_TAB",
        source: "ACTIVITY_FEED",
        action_position: index
      }));
    }
  }

  render() {
    const props = this.props.site;
    const dateLabel = moment(props.lastVisitDate).fromNow() + " ago";
    let icon;
    const iconProps = {
      ref: "icon",
      className: "feed-icon",
      site: props,
      faviconSize: ICON_SIZE,
    };
    console.log(props.images);
    if (props.images && props.images[0]) {
      icon = (<div className="feed-icon-image" style={{backgroundImage: `url(${props.images[0].url})`}}>
        <SiteIcon {...iconProps} width={TOP_LEFT_ICON_SIZE} height={TOP_LEFT_ICON_SIZE} />
      </div>);
    } else {
      icon = (<SiteIcon {...iconProps} />);
    }

    return <li className="feed-item">
      <a onClick={this._updateWeights(this.props.index)} href={props.url}>
        {icon}
        <div className="feed-details">
          <div className="feed-description">
            <h4 className="feed-title" ref="title">{props.title || props.url}</h4>
            <p>{props.description}</p>
            <span className="feed-url" ref="url" data-feed-url={prettyUrl(props.url)} />
            {this.props.preview && <MediaPreview previewInfo={this.props.preview} />}
          </div>
          <div className="feed-stats">
            <div ref="lastVisit" className="last-visit" data-last-visit={dateLabel} />
          </div>
        </div>
      </a>
    </li>;
  }
}

class SpotlightFeed extends React.Component {
  _renderItem(site, i, dispatch) {
    return <SpotlightFeedItem site={site} key={i} index={i} dispatch={dispatch} />
  }

  render() {
    return <div className="grouped-activity-feed">
      <ul className="activity-feed">
        {this.props.sites.map((site, i) => this._renderItem(site, i, this.props.dispatch))}
      </ul>
    </div>;
  }
}

module.exports = connect(justDispatch)(SpotlightFeed);
