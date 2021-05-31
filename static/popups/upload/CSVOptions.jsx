import _ from "lodash";
import PropTypes from "prop-types";
import { Resizable } from "re-resizable";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { withTranslation } from "react-i18next";

import ButtonToggle from "../../ButtonToggle";
import DraggableModalDialog from "../DraggableModalDialog";

const SEP_OPTIONS = [
  ["Comma (,)", "comma"],
  ["Tab (\\n)", "tab"],
  ["Colon (:)", "colon"],
  ["Pipe (|)", "pipe"],
  ["Custom", "custom"],
];

class CSVOptions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      header: true,
      separatorType: "comma",
      separator: "",
      minHeight: null,
      minWidth: null,
    };
  }

  render() {
    const { show, t } = this.props;
    const onResizeStart = (_e, _dir, refToElement) => {
      this.setState({
        minHeight: refToElement.offsetHeight,
        minWidth: refToElement.offsetWidth,
      });
    };
    return (
      <Modal show={show} dialogAs={DraggableModalDialog}>
        <Resizable
          className="modal-resizable"
          defaultSize={{ width: "auto", height: "auto" }}
          minHeight={this.state.minHeight}
          minWidth={this.state.minWidth}
          onResizeStart={onResizeStart}>
          <Modal.Header>
            <Modal.Title>{t("CSV Options")}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.error}
            <div style={{ maxHeight: 300, overflowY: "auto" }} className="col-md-12">
              <div className="form-group row">
                <label className="col-md-3 col-form-label text-right">{t("Header")}?</label>
                <div className="col-md-8">
                  <i
                    className={`ico-check-box${this.state.header ? "" : "-outline-blank"} pointer`}
                    onClick={() => this.setState({ header: !this.state.header })}
                  />
                </div>
              </div>
              <div className="form-group row">
                <label className="col-md-3 col-form-label text-right">{t("Separator")}</label>
                <div className="col-md-8 p-0 mb-auto mt-auto">
                  <ButtonToggle
                    options={_.map(SEP_OPTIONS, ([label, value]) => ({
                      label,
                      value,
                    }))}
                    update={separatorType => this.setState({ separatorType })}
                    defaultValue={this.state.separatorType}
                  />
                </div>
              </div>
              {this.state.separatorType === "custom" && (
                <div className="form-group row">
                  <label className="col-md-3"> </label>
                  <input
                    type="text"
                    className="form-control col-md-2 ml-5 p-2"
                    value={this.state.separator}
                    onChange={e => this.setState({ separator: e.target.value })}
                  />
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              className="btn btn-secondary"
              onClick={() =>
                this.props.propagateState({
                  csv: { show: false },
                  loading: false,
                })
              }>
              <span>{t("Cancel")}</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => this.props.loader(_.pick(this.state, ["header", "separatorType", "separator"]))}>
              <span>{t("Load")}</span>
            </button>
          </Modal.Footer>
          <span className="resizable-handle" />
        </Resizable>
      </Modal>
    );
  }
}
CSVOptions.displayName = "CSVOptions";
CSVOptions.propTypes = {
  show: PropTypes.bool,
  loader: PropTypes.func,
  propagateState: PropTypes.func,
  t: PropTypes.func,
};
export default withTranslation("upload")(CSVOptions);
