import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { connect } from "react-redux";

import { DescribePanel } from "./DescribePanel";
import { MissingNoCharts } from "./MissingNoCharts";

require("./SidePanel.scss");

class ReactSidePanel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { visible, view, hideSidePanel } = this.props;
    return (
      <div className={`side-panel-content${visible ? " is-expanded" : ""} ${view} pl-5 pr-5 pt-3`}>
        {visible && <GlobalHotKeys keyMap={{ CLOSE_PANEL: "esc" }} handlers={{ CLOSE_PANEL: hideSidePanel }} />}
        <DescribePanel />
        {visible && view === "missingno" && <MissingNoCharts />}
      </div>
    );
  }
}
ReactSidePanel.displayName = "ReactSidePanel";
ReactSidePanel.propTypes = {
  visible: PropTypes.bool,
  view: PropTypes.string,
  hideSidePanel: PropTypes.func,
};
const ReduxSidePanel = connect(
  state => ({ ...state.sidePanel }),
  dispatch => ({ hideSidePanel: () => dispatch({ type: "hide-side-panel" }) })
)(ReactSidePanel);
export { ReduxSidePanel as SidePanel, ReactSidePanel };
