import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { buildURLString } from "../../actions/url-utils";
import menuFuncs from "../menu/dataViewerMenuUtils";

const TAB_MAP = { show_hide: "describe" };

class ReactSidePanelButtons extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (!this.props.visible) {
      return null;
    }
    const { dataId, view, column, hideSidePanel, t } = this.props;
    const openTab = () => {
      hideSidePanel();
      const path = `/dtale/popup/${TAB_MAP[view] ?? view}`;
      window.open(buildURLString(menuFuncs.fullPath(path, dataId), column ? { selectedCol: column } : {}), "_blank");
    };
    return (
      <>
        <div className="col-auto pr-0 mb-auto mt-auto">
          <button className="btn btn-plain" onClick={openTab}>
            <i className="ico-open-in-new pointer" />
            <span className="align-middle">{t("Open In New Tab", { ns: "side" })}</span>
          </button>
        </div>
        <div className="col-auto pr-0 mb-auto mt-auto">
          <button className="btn btn-plain" onClick={hideSidePanel}>
            <i className="ico-close pointer" />
            <span className="align-middle">{t("side:Close")}</span>
          </button>
        </div>
      </>
    );
  }
}
ReactSidePanelButtons.displayName = "ReactSidePanelButtons";
ReactSidePanelButtons.propTypes = {
  dataId: PropTypes.string,
  column: PropTypes.string,
  visible: PropTypes.bool,
  view: PropTypes.string,
  hideSidePanel: PropTypes.func,
  t: PropTypes.func,
};
const TranslateSidePanelButtons = withTranslation(["side"])(ReactSidePanelButtons);
const ReduxSidePanelButtons = connect(
  state => ({ ...state.sidePanel, dataId: state.dataId }),
  dispatch => ({ hideSidePanel: () => dispatch({ type: "hide-side-panel" }) })
)(TranslateSidePanelButtons);
export { ReduxSidePanelButtons as SidePanelButtons, TranslateSidePanelButtons as ReactSidePanelButtons };
