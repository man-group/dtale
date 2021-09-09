import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { connect } from "react-redux";
import Draggable from "react-draggable";

import Correlations from "../../popups/Correlations";
import { FilterPanel } from "../../popups/filter/FilterPanel";
import PredictivePowerScore from "../../popups/pps/PredictivePowerScore";
import { DescribePanel } from "./DescribePanel";
import { MissingNoCharts } from "./MissingNoCharts";
import { Panel as PredefinedFilters } from "./predefined_filters/Panel";
import * as panelUtils from "./sidePanelUtils";
import { CorrelationAnalysis } from "./CorrelationAnalysis";
import { GageRnR } from "./GageRnR";

require("./SidePanel.scss");

class ReactSidePanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { offset: undefined, drag: false };
    this.panel = React.createRef();
    this.startResize = this.startResize.bind(this);
    this.resize = this.resize.bind(this);
    this.stopResize = this.stopResize.bind(this);
  }

  shouldComponentUpdate(_nextProps, nextState) {
    return nextState.offset === this.state.offset;
  }

  componentDidUpdate(prevProps) {
    if (this.props.view !== prevProps.view) {
      this.setState({ offset: undefined });
    }
    if (!this.props.visible) {
      this.panel.current?.style.removeProperty("width");
    }
  }

  startResize() {
    this.props.gridPanel.style.setProperty("transition", "none", "important");
    this.panel.current?.style.setProperty("transition", "none", "important");
  }

  resize(deltaX) {
    const offset = _.min([(this.state.offset ?? 0) + deltaX, 0]);
    const { width } = panelUtils.calcWidth(this.props.view, offset);
    this.panel.current?.style.setProperty("width", width, "important");
    this.setState({ offset });
  }

  stopResize() {
    this.props.gridPanel.style.setProperty("transition", null);
    this.panel.current?.style.setProperty("transition", null);
    this.props.updatePanelWidth(this.state.offset);
  }

  render() {
    const { dataId, visible, view, hideSidePanel } = this.props;
    return (
      <div className={`side-panel-content${visible ? ` is-expanded ${view} pl-5 pr-5 pt-3` : ""}`} ref={this.panel}>
        {visible && (
          <Draggable
            axis="x"
            defaultClassName="PanelDragHandle"
            defaultClassNameDragging="PanelDragHandleActive"
            onStart={this.startResize}
            onDrag={(_e, { deltaX }) => this.resize(deltaX)}
            onStop={this.stopResize}
            position={{ x: 0 }}
            zIndex={999}>
            <div className="PanelDragHandleIcon">⋮</div>
          </Draggable>
        )}
        {visible && <GlobalHotKeys keyMap={{ CLOSE_PANEL: "esc" }} handlers={{ CLOSE_PANEL: hideSidePanel }} />}
        <DescribePanel />
        {visible && view === "missingno" && <MissingNoCharts />}
        {visible && view === "corr_analysis" && <CorrelationAnalysis />}
        {visible && view === "correlations" && (
          <Correlations dataId={dataId} chartData={{ visible: true, query: "" }} />
        )}
        {visible && view === "pps" && <PredictivePowerScore dataId={dataId} chartData={{ visible: true, query: "" }} />}
        {visible && view === "filter" && (
          <FilterPanel dataId={dataId} chartData={{ visible: true, propagateState: _.noop }} onClose={hideSidePanel} />
        )}
        {visible && view == "predefined_filters" && <PredefinedFilters />}
        {visible && view == "gage_rnr" && <GageRnR />}
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
  updatePanelWidth: PropTypes.func,
  gridPanel: PropTypes.instanceOf(Element),
};
const ReduxSidePanel = connect(
  state => ({ ...state.sidePanel, dataId: state.dataId }),
  dispatch => ({
    hideSidePanel: () => dispatch({ type: "hide-side-panel" }),
    updatePanelWidth: offset => dispatch({ type: "update-side-panel-width", offset }),
  })
)(ReactSidePanel);
export { ReduxSidePanel as SidePanel, ReactSidePanel };
