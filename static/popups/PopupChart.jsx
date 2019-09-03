import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { Modal, ModalClose, ModalHeader, ModalTitle } from "react-modal-bootstrap";
import { connect } from "react-redux";

import { closeChart } from "../actions/charts";
import { Correlations } from "./Correlations";
import { CoverageChart } from "./CoverageChart";
import { Histogram } from "./Histogram";

class ReactPopupChart extends React.Component {
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
    const { chartData, onClose } = this.props;
    const { type, title, visible } = chartData;
    switch (type) {
      case "histogram":
        modalTitle = (
          <ModalTitle>
            <i className="ico-equalizer" />
            {" Histogram for "}
            <strong>{title}</strong>
            <div id="describe" />
          </ModalTitle>
        );
        body = <Histogram />;
        break;
      case "coverage":
        modalTitle = (
          <ModalTitle>
            <i className="ico-show-chart" />
            {" Coverage"}
          </ModalTitle>
        );
        body = <CoverageChart />;
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
      default:
        break;
    }
    return (
      <Modal {...{ isOpen: visible, onRequestHide: onClose, size: "modal-lg", backdrop: false }}>
        <ModalHeader>
          {modalTitle}
          <ModalClose onClick={onClose} />
        </ModalHeader>
        {body}
      </Modal>
    );
  }
}
ReactPopupChart.displayName = "PopupChart";
ReactPopupChart.propTypes = {
  onClose: PropTypes.func,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    type: PropTypes.string,
    node: PropTypes.string,
    title: PropTypes.string,
  }),
  propagateState: PropTypes.func,
};

function mapStateToProps(state) {
  return {
    library: state.library,
    selectedSnapshots: state.selectedSnapshots,
    securityUid: state.securityUid,
    chartData: state.chartData,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onClose: () => dispatch(closeChart()),
  };
}

const ReduxPopupChart = connect(
  mapStateToProps,
  mapDispatchToProps
)(ReactPopupChart);

export { ReactPopupChart, ReduxPopupChart as PopupChart };
