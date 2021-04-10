import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { DescribePanel } from "./DescribePanel";
import { MissingNoCharts } from "./MissingNoCharts";

require("./SidePanel.scss");

class ReactSidePanel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { visible, view } = this.props;
    return (
      <div className={`side-panel-content${visible ? " is-expanded" : ""} ${view} p-5`}>
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
};
const ReduxSidePanel = connect(state => ({ ...state.sidePanel }))(ReactSidePanel);
export { ReduxSidePanel as SidePanel, ReactSidePanel };
