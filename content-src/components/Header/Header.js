const React = require("react");
const {Link} = require("react-router");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("common/action-manager");
const classNames = require("classnames");

const Header = React.createClass({
  getDefaultProps() {
    return {
      links: [],
      disabled: false
    };
  },
  getInitialState() {
    return {showDropdown: false, searchValue: ""};
  },
  onClick() {
    if (this.props.disabled) {
      return;
    }
    this.setState({showDropdown: !this.state.showDropdown});
  },
  handleChange(event) {
    this.setState({searchValue: event.target.value});
  },
  performSearch(options) {
    let {searchString, page} = options;
    this.props.dispatch(actions.RequestFiltering(searchString));
    this.props.dispatch(actions.NotifyShowPage(page));
  },
  render() {
    const props = this.props;
    return (<header className="head">

      <section ref="clickElement" className={classNames("nav", {"disabled": props.disabled})} onClick={this.onClick}>
        <h1>
          <span hidden={!props.icon} className={`icon icon-spacer icon-${props.icon}`} />
          <span>{props.title}</span>
          <span ref="caret" hidden={props.disabled} className="arrow" />
        </h1>
        <ul ref="dropdown" className="nav-picker" hidden={!this.state.showDropdown}>
          {props.links.map(link => <li key={link.to}><Link to={link.to}>{link.title}</Link></li>)}
        </ul>
      </section>
      <section className="spacer">
      <form className="filter-wrapper">
        <span className="filter-label" />
        <input type="search" placeholder="Search your activity stream" onChange={e => this.handleChange(e)}/>
        <button onClick={e => {e.preventDefault(); this.performSearch({searchString: this.state.searchValue, page: "All"});}}>
          <span className="sr-only">Search</span>
        </button></form>
      </section>
      <section className="user-info">
        {props.userName && <span>
          {props.userName}
        </span>}
        {props.userImage && <img alt=""
          src={props.userImage} />}
      </section>
    </header>);
  }
});

Header.propTypes = {
  userName: React.PropTypes.string,
  userImage: React.PropTypes.string,
  title: React.PropTypes.string.isRequired,
  icon: React.PropTypes.string,
  pathname: React.PropTypes.string.isRequired,
  links: React.PropTypes.array,
  disabled: React.PropTypes.bool,
};

module.exports = connect(justDispatch)(Header);
