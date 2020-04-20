import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { closeChart } from "../actions/charts";

require("./Confirmation.css");

class ReactConfirmation extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { msg, yesAction } = this.props.chartData;
    const fullYesAction = () => {
      yesAction();
      this.props.onClose();
    };
    return [
      <div key="body" className="modal-body">
        <div className="row">
          <div className="col-md-12 text-center">{msg}</div>
        </div>
      </div>,
      <div key="footer" className="modal-footer confirmation">
        <button className="btn btn-primary" onClick={fullYesAction}>
          <span>Yes</span>
        </button>
        <button className="btn btn-secondary" onClick={this.props.onClose}>
          <span>No</span>
        </button>
      </div>,
    ];
  }
}
ReactConfirmation.displayName = "Confirmation";
ReactConfirmation.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    title: PropTypes.string,
    msg: PropTypes.string,
    yesAction: PropTypes.func,
  }),
  onClose: PropTypes.func,
};

const ReduxConfirmation = connect(
  state => _.pick(state, ["chartData"]),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(ReactConfirmation);

export { ReactConfirmation, ReduxConfirmation as Confirmation };
