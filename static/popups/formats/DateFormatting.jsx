import _ from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { withTranslation } from "react-i18next";

const BASE_STATE = { fmt: null };

class DateFormatting extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.assignIn({}, _.get(this.props.columnFormats, this.props.selectedCol, BASE_STATE));
    this.updateState = this.updateState.bind(this);
  }

  updateState(fmt) {
    this.setState({ fmt }, () => this.props.updateState({ fmt }));
  }

  render() {
    const { t } = this.props;
    const m = moment(new Date("2000-01-01"));
    const exampleStr = m.format("MMMM Do YYYY, h:mm:ss a");
    const exampleOutput = _.isNull(this.state.fmt) ? exampleStr : m.format(this.state.fmt);
    return (
      <Modal.Body>
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">
            <span>{t("moment.js Format")}</span>
            <i
              style={{ cursor: "help" }}
              className="ico-info-outline pl-5"
              onClick={e => {
                e.preventDefault();
                window.open(
                  "https://momentjs.com/docs/#/displaying/format/",
                  null,
                  "titlebar=1,location=1,status=1,width=990,height=450"
                );
              }}
            />
          </label>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              value={this.state.fmt || ""}
              onChange={event => this.updateState(event.target.value)}
            />
          </div>
        </div>
        <div className="row text-left" style={{ fontSize: "80%" }}>
          <div className="col-md-12">
            <span className="font-weight-bold pr-3">{t("Raw")}:</span>
            <span>{exampleStr}</span>
          </div>
          <div className="col-md-12">
            <span className="font-weight-bold pr-3">{t("Formatted")}:</span>
            <span>{exampleOutput}</span>
          </div>
        </div>
      </Modal.Body>
    );
  }
}
DateFormatting.displayName = "DateFormatting";
DateFormatting.propTypes = {
  updateState: PropTypes.func,
  columnFormats: PropTypes.object,
  selectedCol: PropTypes.string,
  t: PropTypes.func,
};

export default withTranslation("formatting")(DateFormatting);
