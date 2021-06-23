import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { withTranslation } from "react-i18next";

const BASE_FMT = { truncate: null, link: false, html: false };

class StringFormatting extends React.Component {
  constructor(props) {
    super(props);
    const currFormat = _.get(this.props.columnFormats, this.props.selectedCol, {});
    this.state = { fmt: { ...BASE_FMT, ...currFormat.fmt } };
    this.updateState = this.updateState.bind(this);
  }

  updateState(fmt) {
    if (fmt.html) {
      fmt.link = false;
    }
    if (fmt.link) {
      fmt.html = false;
    }
    const localFmt = { ...this.state.fmt, ...fmt };
    const parentFmt = { ...localFmt };
    if (parentFmt.truncate && !parseInt(parentFmt.truncate)) {
      parentFmt.truncate = null;
    }
    this.setState({ fmt: localFmt }, () => this.props.updateState({ fmt: parentFmt }));
  }

  render() {
    const { t } = this.props;
    const { fmt } = this.state;
    const exampleStr = t("I am a long piece of text, please truncate me.");
    const exampleOutput = _.isNull(fmt.truncate) ? exampleStr : _.truncate(exampleStr, { length: fmt.truncate });
    return (
      <Modal.Body>
        <div className="form-group row mb-2">
          <label className="col-md-4 col-form-label text-right">{t("Render as Hyperlink")}?</label>
          <div className="col-md-8 mt-auto mb-auto">
            <i
              className={`ico-check-box${fmt.link ? "" : "-outline-blank"} pointer`}
              onClick={() => this.updateState({ link: !fmt.link })}
            />
          </div>
        </div>
        <div className="form-group row mb-2">
          <label className="col-md-4 col-form-label text-right">{t("Render as HTML")}?</label>
          <div className="col-md-8 mt-auto mb-auto">
            <i
              className={`ico-check-box${fmt.html ? "" : "-outline-blank"} pointer`}
              onClick={() => this.updateState({ html: !fmt.html })}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">{t("Truncation")}</label>
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
            <span className="font-weight-bold pr-3">{t("Raw")}:</span>
            <span>{exampleStr}</span>
          </div>
          <div className="col-md-12 text-center">
            <span className="font-weight-bold pr-3">{t("Truncated")}:</span>
            <span>{exampleOutput}</span>
          </div>
        </div>
      </Modal.Body>
    );
  }
}
StringFormatting.displayName = "StringFormatting";
StringFormatting.propTypes = {
  updateState: PropTypes.func,
  columnFormats: PropTypes.object,
  selectedCol: PropTypes.string,
  t: PropTypes.func,
};

export default withTranslation("formatting")(StringFormatting);
