import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { ModalBody } from "react-modal-bootstrap";

const BASE_FMT = { truncate: null, link: false };

class StringFormatting extends React.Component {
  constructor(props) {
    super(props);
    const currFormat = _.get(this.props.columnFormats, this.props.selectedCol, {});
    this.state = { fmt: { ...BASE_FMT, ...currFormat.fmt } };
    this.updateState = this.updateState.bind(this);
  }

  updateState(fmt) {
    const localFmt = { ...this.state.fmt, ...fmt };
    const parentFmt = { ...localFmt };
    if (parentFmt.truncate && !parseInt(parentFmt.truncate)) {
      parentFmt.truncate = null;
    }
    this.setState({ fmt: localFmt }, () => this.props.updateState({ fmt: parentFmt }));
  }

  render() {
    const { fmt } = this.state;
    const exampleStr = "I am a long piece of text, please truncate me.";
    const exampleOutput = _.isNull(fmt.truncate) ? exampleStr : _.truncate(exampleStr, { length: fmt.truncate });
    return (
      <ModalBody>
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">Render as Hyperlink?</label>
          <div className="col-md-8 mt-auto mb-auto">
            <i
              className={`ico-check-box${fmt.link ? "" : "-outline-blank"} pointer`}
              onClick={() => this.updateState({ link: !fmt.link })}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">Truncation</label>
          <div className="col-md-6">
            <input
              type="number"
              className="form-control"
              value={this.state.fmt.truncate || ""}
              onChange={event => this.updateState({ truncate: event.target.value })}
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
