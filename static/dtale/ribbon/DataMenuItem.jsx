import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

class ReactDataMenuItem extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.onClick = this.onClick.bind(this);
    this.viewData = this.viewData.bind(this);
  }

  onClick(func) {
    func();
    this.props.hideRibbonMenu();
  }

  viewData() {
    const { id } = this.props;
    const currentHost = window.location.origin;
    const newLoc = `${currentHost}${this.props.iframe ? "/dtale/iframe/" : "/dtale/main/"}${id}`;
    window.location.assign(newLoc);
  }

  render() {
    const { id, name, hideTooltip, showTooltip, cleanup, t } = this.props;
    return (
      <li ref={this.ref} className="hoverable">
        <button
          className="btn btn-plain toggler-action w-100 text-left pointer p-3"
          onMouseOver={() => showTooltip(this.ref.current, t("open_process"))}
          onMouseLeave={hideTooltip}
          onClick={() => this.onClick(this.viewData)}>
          <span className="font-weight-bold">{`${id}${name ? ` - ${name}` : ""}`}</span>
        </button>
        <i
          className="ico-delete mt-auto mb-auto pointer pr-3"
          onClick={() => this.onClick(() => cleanup(id))}
          onMouseOver={() => showTooltip(this.ref.current, t("clear_data"))}
          onMouseLeave={hideTooltip}
        />
      </li>
    );
  }
}
ReactDataMenuItem.displayName = "DataMenuItem";
ReactDataMenuItem.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  showTooltip: PropTypes.func,
  hideTooltip: PropTypes.func,
  hideRibbonMenu: PropTypes.func,
  cleanup: PropTypes.func,
  iframe: PropTypes.bool,
  t: PropTypes.func,
};
const TranslatedDataMenuItem = withTranslation("menu_description")(ReactDataMenuItem);
const ReduxDataMenuItem = connect(
  ({ dataId, iframe }) => ({ dataId, iframe }),
  dispatch => ({
    showTooltip: (element, content) => dispatch({ type: "show-menu-tooltip", element, content }),
    hideTooltip: () => dispatch({ type: "hide-menu-tooltip" }),
    hideRibbonMenu: () => dispatch({ type: "hide-ribbon-menu" }),
  })
)(TranslatedDataMenuItem);

export { ReduxDataMenuItem as DataMenuItem, TranslatedDataMenuItem, ReactDataMenuItem };
