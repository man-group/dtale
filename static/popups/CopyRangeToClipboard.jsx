import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { closeChart } from "../actions/charts";

require("./Confirmation.css");

class ReactCopyRangeToClipboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { includeHeaders: false, finalText: props.chartData.text };
    this.copy = this.copy.bind(this);
    this.update = this.update.bind(this);
    this.onClose = this.onClose.bind(this);
  }

  update(includeHeaders) {
    const { text, headers } = this.props.chartData;
    this.setState({
      includeHeaders,
      finalText: includeHeaders ? `${_.join(headers, "\t")}\n${text}` : text,
    });
  }

  copy() {
    this.textArea.value = this.state.finalText;
    this.textArea.select();
    document.execCommand("copy");
    this.onClose();
  }

  onClose() {
    this.props.propagateState({ rangeSelect: null, columnRange: null }, this.props.onClose);
  }

  render() {
    return (
      <React.Fragment>
        <div className="modal-body">
          <div className="form-group row">
            <label className="col-md-4 col-form-label text-right">Include Headers?</label>
            <div className="col-auto mt-auto mb-auto font-weight-bold p-0">
              <i
                className={`ico-check-box${this.state.includeHeaders ? "" : "-outline-blank"} pointer`}
                onClick={() => this.update(!this.state.includeHeaders)}
              />
            </div>
          </div>
          <div className="form-group row">
            <div className="col-md-12">
              <pre className="mb-0" style={{ maxHeight: 200 }}>
                {_.truncate(this.state.finalText, { length: 500 })}
              </pre>
            </div>
          </div>
        </div>
        <div className="modal-footer confirmation">
          <button className="btn btn-primary" onClick={this.copy}>
            <span>Yes</span>
          </button>
          <button className="btn btn-secondary" onClick={this.onClose}>
            <span>No</span>
          </button>
        </div>
        <textarea
          ref={r => (this.textArea = r)}
          style={{ position: "absolute", left: -1 * window.innerWidth }}
          onChange={_.noop}
        />
      </React.Fragment>
    );
  }
}
ReactCopyRangeToClipboard.displayName = "CopyRangeToClipboard";
ReactCopyRangeToClipboard.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    text: PropTypes.string,
    headers: PropTypes.arrayOf(PropTypes.string),
  }),
  propagateState: PropTypes.func,
  onClose: PropTypes.func,
};

const ReduxCopyRangeToClipboard = connect(
  state => _.pick(state, ["chartData"]),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(ReactCopyRangeToClipboard);

export { ReactCopyRangeToClipboard, ReduxCopyRangeToClipboard as CopyRangeToClipboard };
