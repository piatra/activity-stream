import {LocalizationProvider, Localized} from "fluent-react";
import {actionCreators as ac} from "common/Actions.jsm";
import {OUTGOING_MESSAGE_NAME as AS_GENERAL_OUTGOING_MESSAGE_NAME} from "content-src/lib/init-store";
import {ImpressionsWrapper} from "./components/ImpressionsWrapper/ImpressionsWrapper";
import {MessageContext} from "fluent";
import {NewsletterSnippet} from "./templates/NewsletterSnippet/NewsletterSnippet";
import {OnboardingMessage} from "./templates/OnboardingMessage/OnboardingMessage";
import React from "react";
import ReactDOM from "react-dom";
import {safeURI} from "./template-utils";
import {SimpleSnippet} from "./templates/SimpleSnippet/SimpleSnippet";

const SnippetComponents = {
  SimpleSnippet,
  NewsletterSnippet
};

const INCOMING_MESSAGE_NAME = "ASRouter:parent-to-child";
const OUTGOING_MESSAGE_NAME = "ASRouter:child-to-parent";

export const ASRouterUtils = {
  addListener(listener) {
    global.RPMAddMessageListener(INCOMING_MESSAGE_NAME, listener);
  },
  removeListener(listener) {
    global.RPMRemoveMessageListener(INCOMING_MESSAGE_NAME, listener);
  },
  sendMessage(action) {
    global.RPMSendAsyncMessage(OUTGOING_MESSAGE_NAME, action);
  },
  blockById(id) {
    ASRouterUtils.sendMessage({type: "BLOCK_MESSAGE_BY_ID", data: {id}});
  },
  blockBundle(bundle) {
    ASRouterUtils.sendMessage({type: "BLOCK_BUNDLE", data: {bundle}});
  },
  executeAction(button_action) {
    ASRouterUtils.sendMessage({
      type: "USER_ACTION",
      data: button_action
    });
  },
  unblockById(id) {
    ASRouterUtils.sendMessage({type: "UNBLOCK_MESSAGE_BY_ID", data: {id}});
  },
  unblockBundle(bundle) {
    ASRouterUtils.sendMessage({type: "UNBLOCK_BUNDLE", data: {bundle}});
  },
  getNextMessage() {
    ASRouterUtils.sendMessage({type: "GET_NEXT_MESSAGE"});
  },
  overrideMessage(id) {
    ASRouterUtils.sendMessage({type: "OVERRIDE_MESSAGE", data: {id}});
  },
  sendTelemetry(ping) {
    const payload = ac.ASRouterUserEvent(ping);
    global.RPMSendAsyncMessage(AS_GENERAL_OUTGOING_MESSAGE_NAME, payload);
  },
  getEndpoint() {
    if (window.location.href.includes("endpoint")) {
      const params = new URLSearchParams(window.location.href.slice(window.location.href.indexOf("endpoint")));
      try {
        const endpoint = new URL(params.get("endpoint"));
        return {
          url: endpoint.href,
          snippetId: params.get("snippetId")
        };
      } catch (e) {}
    }

    return null;
  }
};

// Note: nextProps/prevProps refer to props passed to <ImpressionsWrapper />, not <ASRouterUISurface />
function shouldSendImpressionOnUpdate(nextProps, prevProps) {
  return (nextProps.message.id && (!prevProps.message || prevProps.message.id !== nextProps.message.id));
}

function generateMessages(messages) {
  const cx = new MessageContext("en-US");
  messages.forEach(({localization_id, content}) => cx.addMessages(`${localization_id} = ${content}`));
  return [cx];
}

// Elements allowed in snippet content
const ALLOWED_TAGS = {
  b: <b />,
  i: <i />,
  u: <u />,
  strong: <strong />,
  em: <em />,
  br: <br />
};

/**
 * Transform an object (tag name: {url}) into (tag name: anchor) where the url
 * is used as href, in order to render links inside a Fluent.Localized component.
 */
export function convertLinks(links, sendClick) {
  if (links) {
    return Object.keys(links).reduce((acc, linkTag) => {
      acc[linkTag] = <a href={safeURI(links[linkTag].url)} data-metric={links[linkTag].metric} onClick={sendClick} />;
      return acc;
    }, {});
  }

  return null;
}

/**
 * Message wrapper used to sanitize markup and render HTML.
 */
function RichText(props) {
  return (
    <Localized id={props.localization_id} {...ALLOWED_TAGS} {...convertLinks(props.links, props.sendClick)}>
      <span>{props.text}</span>
    </Localized>
  );
}

export class ASRouterUISurface extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onMessageFromParent = this.onMessageFromParent.bind(this);
    this.sendClick = this.sendClick.bind(this);
    this.sendImpression = this.sendImpression.bind(this);
    this.sendUserActionTelemetry = this.sendUserActionTelemetry.bind(this);
    this.state = {message: {}, bundle: {}};
  }

  sendUserActionTelemetry(extraProps = {}) {
    const {message, bundle} = this.state;
    if (!message && !extraProps.message_id) {
      throw new Error(`You must provide a message_id for bundled messages`);
    }
    const eventType = `${message.provider || bundle.provider}_user_event`;
    ASRouterUtils.sendTelemetry({
      message_id: message.id || extraProps.message_id,
      source: extraProps.id,
      action: eventType,
      ...extraProps
    });
  }

  sendImpression(extraProps) {
    ASRouterUtils.sendMessage({type: "IMPRESSION", data: this.state.message});
    this.sendUserActionTelemetry({event: "IMPRESSION", ...extraProps});
  }

  // If link has a `metric` data attribute send it as part of the `value`
  // telemetry field which can have arbitrary values.
  // Used for router messages with links as part of the content.
  sendClick(event) {
    const metric = {
      value: event.target.dataset.metric,
      // Used for the `source` of the event. Needed to differentiate
      // from other snippet or onboarding events that may occur.
      id: "NEWTAB_FOOTER_BAR_CONTENT"
    };
    this.sendUserActionTelemetry({event: "CLICK_BUTTON", ...metric});
    if (!this.state.message.content.do_not_autoblock) {
      ASRouterUtils.blockById(this.state.message.id);
    }
  }

  onBlockById(id) {
    return () => ASRouterUtils.blockById(id);
  }

  clearBundle(bundle) {
    return () => ASRouterUtils.blockBundle(bundle);
  }

  onMessageFromParent({data: action}) {
    switch (action.type) {
      case "SET_MESSAGE":
        this.setState({message: action.data});
        break;
      case "SET_BUNDLED_MESSAGES":
        this.setState({bundle: action.data});
        break;
      case "CLEAR_MESSAGE":
        if (action.data.id === this.state.message.id) {
          this.setState({message: {}});
        }
        break;
      case "CLEAR_PROVIDER":
        if (action.data.id === this.state.message.provider) {
          this.setState({message: {}});
        }
        break;
      case "CLEAR_BUNDLE":
        if (this.state.bundle.bundle) {
          this.setState({bundle: {}});
        }
        break;
      case "CLEAR_ALL":
        this.setState({message: {}, bundle: {}});
    }
  }

  componentWillMount() {
    const endpoint = ASRouterUtils.getEndpoint();
    ASRouterUtils.addListener(this.onMessageFromParent);

    // If we are loading about:welcome we want to trigger the onboarding messages
    if (this.props.document.location.href === "about:welcome") {
      ASRouterUtils.sendMessage({type: "TRIGGER", data: {trigger: {id: "firstRun"}}});
    } else {
      ASRouterUtils.sendMessage({type: "CONNECT_UI_REQUEST", data: {endpoint}});
    }
  }

  componentWillUnmount() {
    ASRouterUtils.removeListener(this.onMessageFromParent);
  }

  renderSnippets() {
    let privacyNoticeRichText;

    const template = this.state.message.template === "simple_snippet" ? "SimpleSnippet" : "NewsletterSnippet";
    const SnippetComponent = SnippetComponents[template];
    const localizedContent = [{"localization_id": "snippet_content", "content": this.state.message.content.text}];

    if (template === "NewsletterSnippet") {
      const {form} = this.state.message.content;

      privacyNoticeRichText = (<RichText text={form.privacy_notice.text}
        localization_id="privacy_notice"
        links={form.privacy_notice.links}
        sendClick={this.sendClick} />);
      localizedContent.push({"localization_id": "privacy_notice", "content": form.privacy_notice.text});
    }

    return (
      <ImpressionsWrapper
        id="NEWTAB_FOOTER_BAR"
        message={this.state.message}
        sendImpression={this.sendImpression}
        shouldSendImpressionOnUpdate={shouldSendImpressionOnUpdate}
        // This helps with testing
        document={this.props.document}>
          <LocalizationProvider messages={generateMessages(localizedContent)}>
            <SnippetComponent
              {...this.state.message}
              richText={<RichText text={this.state.message.content.text}
                                  localization_id="snippet_content"
                                  links={this.state.message.content.links}
                                  sendClick={this.sendClick} />}
              privacyNoticeRichText={privacyNoticeRichText}
              UISurface="NEWTAB_FOOTER_BAR"
              getNextMessage={ASRouterUtils.getNextMessage}
              onBlock={this.onBlockById(this.state.message.id)}
              onAction={ASRouterUtils.executeAction}
              sendUserActionTelemetry={this.sendUserActionTelemetry} />
          </LocalizationProvider>
      </ImpressionsWrapper>);
  }

  renderOnboarding() {
    return (
      <OnboardingMessage
        {...this.state.bundle}
        UISurface="NEWTAB_OVERLAY"
        onAction={ASRouterUtils.executeAction}
        onDoneButton={this.clearBundle(this.state.bundle.bundle)}
        getNextMessage={ASRouterUtils.getNextMessage}
        sendUserActionTelemetry={this.sendUserActionTelemetry} />);
  }

  renderPreviewBanner() {
    if (this.state.message.provider !== "preview") {
      return null;
    }

    return (
      <div className="snippets-preview-banner">
        <span className="icon icon-small-spacer icon-info" />
        <span>Preview Purposes Only</span>
      </div>
    );
  }

  render() {
    const {message, bundle} = this.state;
    if (!message.id && !bundle.template) { return null; }
    return (
      <div>
        {this.renderPreviewBanner()}
        {bundle.template === "onboarding" ? this.renderOnboarding() : this.renderSnippets()}
      </div>
    );
  }
}

ASRouterUISurface.defaultProps = {document: global.document};

export class ASRouterContent {
  constructor() {
    this.initialized = false;
    this.containerElement = null;
  }

  _mount() {
    this.containerElement = global.document.getElementById("snippets-container");
    ReactDOM.render(<ASRouterUISurface />, this.containerElement);
  }

  _unmount() {
    ReactDOM.unmountComponentAtNode(this.containerElement);
  }

  init() {
    this._mount();
    this.initialized = true;
  }

  uninit() {
    if (this.initialized) {
      this._unmount();
      this.initialized = false;
    }
  }
}
