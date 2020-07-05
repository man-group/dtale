import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { Modal, ModalClose, ModalHeader, ModalTitle } from "react-modal-bootstrap";
import { connect } from "react-redux";

import ConditionalRender from "../ConditionalRender";
import { closeChart } from "../actions/charts";
import About from "./About";
import { CodeExport } from "./CodeExport";
import { Confirmation } from "./Confirmation";
import { Correlations } from "./Correlations";
import { Describe } from "./Describe";
import { Error } from "./ErrorPopup";
import { Filter } from "./Filter";
import Instances from "./Instances";
import { RangeHighlight } from "./RangeHighlight";
import { Rename } from "./Rename";
import { XArrayDimensions } from "./XArrayDimensions";
import { XArrayIndexes } from "./XArrayIndexes";
import { ColumnAnalysis } from "./analysis/ColumnAnalysis";
import { Charts } from "./charts/Charts";
import { CreateColumn } from "./create/CreateColumn";
import { CreateReplacement } from "./replacement/CreateReplacement";
import { Reshape } from "./reshape/Reshape";

class ReactPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = { title: "" };
  }

  shouldComponentUpdate(newProps) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }

    // Otherwise, use the default react behaviour.
    return false;
  }

  render() {
    let modalTitle = null;
    let body = null;
    const { chartData } = this.props;
    const { type, title, visible, size, backdrop } = chartData;
    switch (type) {
      case "filter":
        modalTitle = (
          <ModalTitle>
            <i className="fa fa-filter" />
            <strong>Custom Filter</strong>
          </ModalTitle>
        );
        body = <Filter />;
        break;
      case "column-analysis":
        modalTitle = (
          <ModalTitle>
            <i className="ico-equalizer" />
            {" Column Analysis for "}
            <strong>{chartData.selectedCol}</strong>
            <div id="describe" />
          </ModalTitle>
        );
        body = <ColumnAnalysis />;
        break;
      case "correlations":
        modalTitle = (
          <ModalTitle>
            <i className="ico-bubble-chart" />
            <strong>{title}</strong>
          </ModalTitle>
        );
        body = <Correlations propagateState={this.props.propagateState} />;
        break;
      case "describe":
        modalTitle = (
          <ModalTitle>
            <i className="ico-view-column" />
            <strong>{"Describe"}</strong>
          </ModalTitle>
        );
        body = <Describe />;
        break;
      case "build":
        modalTitle = (
          <ModalTitle>
            <i className="ico-build" />
            <strong>{"Build Column"}</strong>
          </ModalTitle>
        );
        body = <CreateColumn />;
        break;
      case "reshape":
        modalTitle = (
          <ModalTitle>
            <i className="fas fa-tools" />
            <strong>{"Summarize Data"}</strong>
          </ModalTitle>
        );
        body = <Reshape />;
        break;
      case "about":
        modalTitle = (
          <ModalTitle>
            <i className="fa fa-info-circle la-lg" />
            <strong>{"About"}</strong>
          </ModalTitle>
        );
        body = <About />;
        break;
      case "confirm":
        modalTitle = (
          <ModalTitle>
            <i className="ico-check-circle" />
            <strong>Yes/No</strong>
            <small className="pl-3">({chartData.title})</small>
          </ModalTitle>
        );
        body = <Confirmation />;
        break;
      case "range":
        modalTitle = (
          <ModalTitle>
            <i className="ico-flag" />
            <strong>Range Highlights</strong>
          </ModalTitle>
        );
        body = <RangeHighlight {...this.props} />;
        break;
      case "xarray-dimensions":
        modalTitle = (
          <ModalTitle>
            <i className="ico-key" />
            <strong>XArray Dimensions</strong>
          </ModalTitle>
        );
        body = <XArrayDimensions {...this.props} />;
        break;
      case "xarray-indexes":
        modalTitle = (
          <ModalTitle>
            <i className="ico-tune" />
            <strong>Convert to XArray</strong>
          </ModalTitle>
        );
        body = <XArrayIndexes {...this.props} />;
        break;
      case "rename":
        modalTitle = (
          <ModalTitle>
            <i className="ico-edit" />
            <strong>Rename</strong>
          </ModalTitle>
        );
        body = <Rename {...this.props} />;
        break;
      case "replacement":
        modalTitle = (
          <ModalTitle>
            <i className="fas fa-backspace" />
            {" Replacements for "}
            <strong>{chartData.selectedCol}</strong>
          </ModalTitle>
        );
        body = <CreateReplacement {...this.props} />;
        break;
      case "error":
        modalTitle = (
          <ModalTitle>
            <i className="ico-cancel" />
            <strong>Error</strong>
          </ModalTitle>
        );
        body = <Error {...this.props} />;
        break;
      case "instances":
        modalTitle = (
          <ModalTitle>
            <i className="ico-apps" />
            <strong>{"Active D-Tale Instances"}</strong>
          </ModalTitle>
        );
        body = <Instances {...this.props} />;
        break;
      case "charts":
        modalTitle = (
          <ModalTitle>
            <i className="ico-show-chart" />
            <strong>Chart Builder</strong>
          </ModalTitle>
        );
        body = <Charts />;
        break;
      case "code":
        modalTitle = (
          <ModalTitle>
            <i className="ico-code" />
            <strong>Code Export</strong>
          </ModalTitle>
        );
        body = <CodeExport {...this.props} />;
        break;
      default:
        break;
    }
    const onClose = () => this.props.onClose({ size: size || "modal-lg" });
    return (
      <Modal
        {...{
          isOpen: visible,
          onRequestHide: onClose,
          size: size || "modal-lg",
          backdrop: backdrop || false,
          className: `${type}-modal`,
        }}>
        <GlobalHotKeys keyMap={{ CLOSE_MODAL: "esc" }} handlers={{ CLOSE_MODAL: onClose }} />
        <ModalHeader>
          {modalTitle}
          <ModalClose onClick={onClose} />
        </ModalHeader>
        <ConditionalRender display={_.get(this.props, "chartData.visible")}>{body}</ConditionalRender>
      </Modal>
    );
  }
}
ReactPopup.displayName = "Popup";
ReactPopup.propTypes = {
  onClose: PropTypes.func,
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    type: PropTypes.string,
    title: PropTypes.string,
    size: PropTypes.string,
    backdrop: PropTypes.bool,
    selectedCol: PropTypes.string,
    rowIndex: PropTypes.number,
  }),
  propagateState: PropTypes.func,
};

const ReduxPopup = connect(
  state => _.pick(state, ["dataId", "iframe", "chartData"]),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(ReactPopup);

export { ReactPopup, ReduxPopup as Popup };
