import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { DescribePanel } from "./DescribePanel";

require("./SidePanel.scss");

class ReactSidePanel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { visible, view, column } = this.props;
    return (
      <div className={`side-panel-content${visible ? " is-expanded" : ""} p-5`}>
        <DescribePanel />
        {visible && view !== "describe" && <h1>{`${view} - ${column}`}</h1>}
      </div>
    );
  }
}
ReactSidePanel.displayName = "ReactSidePanel";
ReactSidePanel.propTypes = {
  visible: PropTypes.bool,
  column: PropTypes.string,
  view: PropTypes.string,
};
const ReduxSidePanel = connect(state => ({ ...state.sidePanel }))(ReactSidePanel);
export { ReduxSidePanel as SidePanel, ReactSidePanel };
