import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { connect } from "react-redux";

import { Correlations } from "../../popups/Correlations";
import { FilterPanel } from "../../popups/filter/FilterPanel";
import PredictivePowerScore from "../../popups/pps/PredictivePowerScore";
import { DescribePanel } from "./DescribePanel";
import { MissingNoCharts } from "./MissingNoCharts";
import { Panel as PredefinedFilters } from "./predefined_filters/Panel";

require("./SidePanel.scss");

class ReactSidePanel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { dataId, visible, view, hideSidePanel } = this.props;
    return (
      <div className={`side-panel-content${visible ? ` is-expanded ${view} pl-5 pr-5 pt-3` : ""}`}>
        {visible && <GlobalHotKeys keyMap={{ CLOSE_PANEL: "esc" }} handlers={{ CLOSE_PANEL: hideSidePanel }} />}
        <DescribePanel />
        {visible && view === "missingno" && <MissingNoCharts />}
        {visible && view === "correlations" && (
          <Correlations dataId={dataId} chartData={{ visible: true, query: "" }} />
        )}
        {visible && view === "pps" && <PredictivePowerScore dataId={dataId} chartData={{ visible: true, query: "" }} />}
        {visible && view === "filter" && (
          <FilterPanel dataId={dataId} chartData={{ visible: true, propagateState: _.noop }} onClose={hideSidePanel} />
        )}
        {visible && view == "predefined_filters" && <PredefinedFilters />}
      </div>
    );
  }
}
ReactSidePanel.displayName = "ReactSidePanel";
ReactSidePanel.propTypes = {
  dataId: PropTypes.string,
  visible: PropTypes.bool,
  view: PropTypes.string,
  hideSidePanel: PropTypes.func,
};
const ReduxSidePanel = connect(
  state => ({ ...state.sidePanel, dataId: state.dataId }),
  dispatch => ({ hideSidePanel: () => dispatch({ type: "hide-side-panel" }) })
)(ReactSidePanel);
export { ReduxSidePanel as SidePanel, ReactSidePanel };
