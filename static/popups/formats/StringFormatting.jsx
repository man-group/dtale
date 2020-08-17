import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { ModalBody } from "react-modal-bootstrap";

const BASE_STATE = { fmt: null };

class StringFormatting extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.assign({}, _.get(this.props.columnFormats, this.props.selectedCol, BASE_STATE));
    this.updateState = this.updateState.bind(this);
  }

  updateState(fmt) {
    const mainState = { fmt: null };
    if (fmt && parseInt(fmt)) {
      mainState.fmt = fmt;
    }
    this.setState({ fmt }, () => this.props.updateState(mainState));
  }

  render() {
    const exampleStr = "I am a long piece of text, please truncate me.";
    const exampleOutput = _.isNull(this.state.fmt) ? exampleStr : _.truncate(exampleStr, { length: this.state.fmt });
    return (
      <ModalBody>
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">Truncation</label>
          <div className="col-md-6">
            <input
              type="number"
              className="form-control"
              value={this.state.fmt || ""}
              onChange={event => this.updateState(event.target.value)}
            />
          </div>
        </div>
        <div className="row text-left" style={{ fontSize: "80%" }}>
          <div className="col-md-12 text-center">
            <span className="font-weight-bold pr-3">Raw:</span>
            <span>{exampleStr}</span>
          </div>
          <div className="col-md-12 text-center">
            <span className="font-weight-bold pr-3">Truncated:</span>
            <span>{exampleOutput}</span>
          </div>
        </div>
      </ModalBody>
    );
  }
}
StringFormatting.displayName = "StringFormatting";
StringFormatting.propTypes = {
  updateState: PropTypes.func,
  columnFormats: PropTypes.object,
  selectedCol: PropTypes.string,
};

export default StringFormatting;
