const React = require("react");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");
const {FormattedMessage} = require("react-intl");
const {TopSiteLink} = require("./TopSite");

const {TOP_SITES_SOURCE} = require("./TopSitesConstants");

class TopSiteForm extends React.PureComponent {
  constructor(props) {
    super(props);
    const {Topsite} = props;
    this.state = {
      label: Topsite ? (Topsite.label || Topsite.hostname) : "",
      url: Topsite ? Topsite.url : "",
      customScreenshotUrl: Topsite ? Topsite.customScreenshotURL : "",
      screenshotUrlValidationError: false,
      validationError: false,
      pendingScreenshotUpdate: false,
      // Keep the preview screenshot data in the state to avoid showing
      // cached results from previous requests.
      screenshotPreview: null,
      showCustomScreenshotForm: false,
      screenshotRequestFailed: false
    };
    this.onLabelChange = this.onLabelChange.bind(this);
    this.onUrlChange = this.onUrlChange.bind(this);
    this.onCustomScreenshotUrlChange = this.onCustomScreenshotUrlChange.bind(this);
    this.onCancelButtonClick = this.onCancelButtonClick.bind(this);
    this.onHideCustomScreenshotForm = this.onHideCustomScreenshotForm.bind(this);
    this.onAddButtonClick = this.onAddButtonClick.bind(this);
    this.onPreviewButtonClick = this.onPreviewButtonClick.bind(this);
    this.onSaveButtonClick = this.onSaveButtonClick.bind(this);
    this.onUrlInputMount = this.onUrlInputMount.bind(this);
    this.onEnableScreenshotUrlForm = this.onEnableScreenshotUrlForm.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    // If pending request and screenshot changes or request error, then the
    // screenshot preview request finished.
    if ((nextProps.Topsite.screenshotPreview && this.state.pendingScreenshotUpdate) ||
        nextProps.screenshotRequestFailed) {
      this.setState({
        pendingScreenshotUpdate: false,
        screenshotPreview: nextProps.Topsite.screenshotPreview,
        screenshotRequestFailed: nextProps.screenshotRequestFailed
      });
    }
  }
  onLabelChange(event) {
    this.resetValidation();
    this.setState({"label": event.target.value});
  }
  onUrlChange(event) {
    this.resetValidation();
    this.setState({"url": event.target.value});
  }
  onCustomScreenshotUrlChange(event) {
    this.setState({
      customScreenshotUrl: event.target.value,
      // Reset any cached preview when we change the custom screenshot url
      pendingScreenshotUpdate: false,
      screenshotPreview: null,
      screenshotUrlValidationError: !this.validateUrl(event.target.value)
    });
  }
  onCancelButtonClick(ev) {
    ev.preventDefault();
    this.props.onClose();
  }
  onAddButtonClick(ev) {
    ev.preventDefault();
    if (this.validateForm()) {
      let site = {url: this.cleanUrl(this.state.url)};
      if (this.state.label !== "") {
        site.label = this.state.label;
      }
      this.props.dispatch(ac.SendToMain({
        type: at.TOP_SITES_ADD,
        data: {site}
      }));
      this.props.dispatch(ac.UserEvent({
        source: TOP_SITES_SOURCE,
        event: "TOP_SITES_ADD"
      }));
      this.props.onClose();
    }
  }
  onPreviewButtonClick(event) {
    event.preventDefault();
    if (this.state.screenshotUrlValidationError) {
      return;
    }
    // Start the loading animation and reset any cached values from previous
    // requests
    this.setState({
      pendingScreenshotUpdate: true,
      screenshotPreview: null,
      screenshotRequestFailed: false
    });

    // Dispatch the request for the custom screenshot.
    this.props.dispatch(ac.SendToMain({
      type: at.SCREENSHOT_REQUEST,
      data: {
        url: this.cleanUrl(this.state.url),
        customScreenshotURL: this.cleanUrl(this.state.customScreenshotUrl)
      }
    }));
  }
  onSaveButtonClick(ev) {
    ev.preventDefault();
    if (this.validateForm()) {
      let customScreenshotURL = null;
      const url = this.cleanUrl(this.state.url);
      // If custom screenshot was updated save the new URL
      if (this.state.screenshotPreview) {
        customScreenshotURL = this.cleanUrl(this.state.customScreenshotUrl);
      }
      let site = {url, customScreenshotURL};
      if (this.state.label !== "") {
        site.label = this.state.label;
      }
      this.props.dispatch(ac.SendToMain({
        type: at.TOP_SITES_PIN,
        data: {site, index: this.props.index}
      }));
      this.props.dispatch(ac.UserEvent({
        source: TOP_SITES_SOURCE,
        event: "TOP_SITES_EDIT",
        action_position: this.props.index
      }));
      this.props.onClose();
    }
  }
  onEnableScreenshotUrlForm() {
    this.setState({
      showCustomScreenshotForm: true,
      customScreenshotURL: this.props.Topsite.customScreenshotURL
    });
  }
  onHideCustomScreenshotForm() {
    // If the input is empty and we click away then hide the input and
    // clear any error states.
    if (!this.state.customScreenshotUrl) {
      this.setState({
        showCustomScreenshotForm: false,
        screenshotRequestFailed: false,
        screenshotUrlValidationError: false
      });
    }
  }
  cleanUrl(url) {
    // If we are missing a protocol, prepend http://
    if (!url.startsWith("http:") && !url.startsWith("https:")) {
      return `http://${url}`;
    }
    return url;
  }
  resetValidation() {
    if (this.state.validationError) {
      this.setState({validationError: false});
    }
  }
  validateUrl(url) {
    try {
      return !!new URL(this.cleanUrl(url));
    } catch (e) {
      return false;
    }
  }
  validateForm() {
    this.resetValidation();
    // Only the URL is required and must be valid.
    if (!this.state.url || !this.validateUrl(this.state.url)) {
      this.setState({validationError: true});
      this.inputUrl.focus();
      return false;
    }
    return true;
  }
  onUrlInputMount(input) {
    this.inputUrl = input;
  }
  render() {
    const updatedCustomScreenshotURL = this.props.Topsite && this.state.customScreenshotUrl &&
      (this.props.Topsite.customScreenshotURL !== this.cleanUrl(this.state.customScreenshotUrl));
    const previewMode = (updatedCustomScreenshotURL && !this.state.screenshotPreview) ||
                        this.state.screenshotRequestFailed ||
                        this.state.screenshotUrlValidationError;
    return (
      <form className="topsite-form">
        <div className="topsite-form-container">
          {/* Don't show topsite preview when adding a new topsite. */}
          {this.props.Topsite && <section className="edit-topsites-image-preview top-sites-list">
            <TopSiteLink link={this.props.Topsite} title={this.state.label}
              screenshotRequestFailed={this.state.screenshotRequestFailed}
              screenshotPreview={this.state.screenshotPreview} />
          </section>}
          <section className={`edit-topsites-inner-wrapper ${!this.props.Topsite ? "form-centered" : ""}`}>
            <div className="form-wrapper">
              <label>Title
                <div className="field title">
                  <input
                    type="text"
                    value={this.state.label}
                    onChange={this.onLabelChange}
                    placeholder={this.props.intl.formatMessage({id: "topsites_form_title_placeholder"})} />
                </div>
              </label>
              <label>URL
                <div className={`field url${this.state.validationError ? " invalid" : ""}`}>
                  <input
                    type="text"
                    ref={this.onUrlInputMount}
                    value={this.state.url}
                    onChange={this.onUrlChange}
                    placeholder={this.props.intl.formatMessage({id: "topsites_form_url_placeholder"})} />
                  {this.state.validationError &&
                    <aside className="error-tooltip">
                      <FormattedMessage id="topsites_form_url_validation" />
                    </aside>
                  }
                </div>
              </label>
              {(this.state.showCustomScreenshotForm || (this.props.Topsite && this.props.Topsite.customScreenshotURL)) ? <label>Custom Image
                <div className={`field url${this.state.validationError ? " invalid" : ""}`}>
                  <div className="custom-image-input-container">
                    {this.state.pendingScreenshotUpdate && <div className="loading-container">
                      <div className="loading-animation" />
                    </div>}
                    <input
                      type="text"
                      value={this.state.customScreenshotUrl}
                      onChange={this.onCustomScreenshotUrlChange}
                      onBlur={this.onHideCustomScreenshotForm}
                      placeholder="Paste a URL here" />
                  </div>
                  {this.state.screenshotUrlValidationError &&
                    <aside className="error-tooltip">
                      <FormattedMessage id="topsites_form_url_validation" />
                    </aside>}
                  {this.state.screenshotRequestFailed &&
                    <aside className="error-tooltip">
                      There was an error with your request
                    </aside>}
                </div>
              </label> : this.props.Topsite && <div className="enable-custom-image-input" onClick={this.onEnableScreenshotUrlForm}>
                <a>Use a custom icon</a>
              </div>}
            </div>
          </section>
        </div>
        <section className="actions">
          <button className="cancel" type="button" onClick={this.onCancelButtonClick}>
            <FormattedMessage id="topsites_form_cancel_button" />
          </button>
          {this.props.editMode && previewMode &&
            <button className="done save" type="submit" onClick={this.onPreviewButtonClick}>
              Preview
            </button>
          }
          {this.props.editMode && !previewMode &&
            <button className="done save" type="submit" onClick={this.onSaveButtonClick}>
              <FormattedMessage id="topsites_form_save_button" />
            </button>
          }
          {!this.props.editMode &&
            <button className="done add" type="submit" onClick={this.onAddButtonClick}>
              <FormattedMessage id="topsites_form_add_button" />
            </button>
          }
        </section>
      </form>
    );
  }
}

TopSiteForm.defaultProps = {
  Topsite: {},
  index: 0,
  editMode: false, // by default we are in "Add New Top Site" mode
  screenshotRequestFailed: false
};

module.exports = TopSiteForm;
