import {Button} from "../../components/Button/Button";
import React from "react";
import {safeURI} from "../../template-utils";
import {SnippetBase} from "../../components/SnippetBase/SnippetBase";

const DEFAULT_ICON_PATH = "chrome://branding/content/icon64.png";

export class NewsletterSnippet extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onButtonClick = this.onButtonClick.bind(this);
    this.expandSnippet = this.expandSnippet.bind(this);
    this.state = {expanded: false};
  }

  onButtonClick() {
    this.props.sendUserActionTelemetry({event: "CLICK_BUTTON", id: this.props.UISurface});
    this.props.onAction(this.props.content.button_action);
    if (!this.props.content.do_not_autoblock) {
      this.props.onBlock();
    }
  }

  renderTitle() {
    const {title} = this.props.content;
    return title ? <h3 className="title">{title}</h3> : null;
  }

  renderTitleIcon() {
    const titleIcon = safeURI(this.props.content.title_icon);
    return titleIcon ? <span className="titleIcon" style={{backgroundImage: `url("${titleIcon}")`}} /> : null;
  }

  expandSnippet() {
    this.setState({expanded: true});
  }

  renderButton(props) {
    return (<Button
      onClick={props.onClick}
      color={props.content.button_color}
      backgroundColor={props.content.button_background_color}>
      {props.content.button_label}
    </Button>);
  }

  renderHiddenFormInputs() {
    return this.props.content.hiddenFormInputs &&
      this.props.content.hiddenFormInputs.map((props, idx) => <input key={idx} type="hidden" {...props} />);
  }

  renderFormPrivacyNotice() {
    const {privacyNoticeRichText} = this.props;

    return privacyNoticeRichText && (<label className="privacy-notice" htmlFor="id_privacy">
        <p>
          <input type="checkbox" id="id_privacy" name="privacy" required="required" />
          <span>{privacyNoticeRichText}</span>
        </p>
      </label>);
  }

  renderSignupView() {
    const {form} = this.props.content;

    return (<SnippetBase {...this.props} className="NewsletterSnippet" footerDismiss={true}>
        <div className="message">
          <p>{form.heading.text}</p>
        </div>
        <form action={form.action.url} method="POST">
          {this.renderHiddenFormInputs()}
          <div>
            <input type={form.input.type} name={form.input.name} required="required" placeholder={form.input.placeholder} autoFocus={true} />
            <button type="submit" className="ASRouterButton primary">{form.button_submit_label}</button>
          </div>
          {this.renderFormPrivacyNotice()}
        </form>
      </SnippetBase>);
  }

  render() {
    const {props} = this;
    if (this.state.expanded) {
      return this.renderSignupView();
    }
    return (<SnippetBase {...props} className="NewsletterSnippet">
      <img src={safeURI(props.content.icon) || DEFAULT_ICON_PATH} className="icon" />
      <div>
        {this.renderTitleIcon()} {this.renderTitle()} <p className="body">{props.richText || props.content.text}</p>
      </div>
      {<div>{this.renderButton({content: {button_label: "Expand"}, onClick: this.expandSnippet})}</div>}
    </SnippetBase>);
  }
}
