import _ from "lodash";
import PropTypes from "prop-types";
import { Resizable } from "re-resizable";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { withTranslation } from "react-i18next";

import { RemovableError } from "../../RemovableError";
import { buildURLString } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import DraggableModalDialog from "../DraggableModalDialog";
import { jumpToDataset } from "./uploadUtils";

class SheetSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sheets: [], minHeight: null, minWidth: null };
    this.updateSelected = this.updateSelected.bind(this);
    this.loadSheets = this.loadSheets.bind(this);
    this.clearSheets = this.clearSheets.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props.sheets, prevProps.sheets)) {
      this.setState({ sheets: this.props.sheets });
    }
  }

  updateSelected(dataId) {
    this.setState({
      sheets: _.map(this.state.sheets, s => (s.dataId === dataId ? { ...s, selected: !s.selected } : { ...s })),
    });
  }

  clearSheets() {
    const sheetsToDelete = _.join(_.map(this.state.sheets, "dataId"), ",");
    fetchJson(buildURLString("/dtale/cleanup-datasets", { dataIds: sheetsToDelete }), () => {
      this.props.propagateState({ sheets: [] });
    });
  }

  loadSheets() {
    const sheetsToDelete = _.join(_.map(_.reject(this.state.sheets, "selected"), "dataId"), ",");
    const dataId = _.find(this.state.sheets, "selected").dataId;
    if (!sheetsToDelete.length) {
      jumpToDataset(dataId, this.props.mergeRefresher);
      return;
    }
    fetchJson(buildURLString("/dtale/cleanup-datasets", { dataIds: sheetsToDelete }), data => {
      if (data.error) {
        this.setState({ error: <RemovableError {...data} /> });
        return;
      }
      jumpToDataset(dataId, this.props.mergeRefresher);
    });
  }

  render() {
    const { t } = this.props;
    const { sheets } = this.state;
    const onResizeStart = (_e, _dir, refToElement) => {
      this.setState({
        minHeight: refToElement.offsetHeight,
        minWidth: refToElement.offsetWidth,
      });
    };
    return (
      <Modal show={_.size(sheets) > 0} dialogAs={DraggableModalDialog}>
        <Resizable
          className="modal-resizable"
          defaultSize={{ width: "auto", height: "auto" }}
          minHeight={this.state.minHeight}
          minWidth={this.state.minWidth}
          onResizeStart={onResizeStart}>
          <Modal.Header>
            <Modal.Title>{t("Sheet Selection")}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.error}
            <div style={{ maxHeight: 300, overflowY: "auto" }} className="col-md-4">
              <ul>
                {_.map(sheets, (sheet, i) => (
                  <li key={i}>
                    <i
                      className={`ico-check-box${sheet.selected ? "" : "-outline-blank"} pointer pb-2 pr-3`}
                      onClick={() => this.updateSelected(sheet.dataId)}
                    />
                    <b>{sheet.name}</b>
                  </li>
                ))}
              </ul>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-secondary" onClick={this.clearSheets}>
              <span>{t("Clear Sheets")}</span>
            </button>
            <button
              className="btn btn-primary"
              disabled={_.find(sheets, "selected") === undefined}
              onClick={this.loadSheets}>
              <span>{t("Load Sheets")}</span>
            </button>
          </Modal.Footer>
          <span className="resizable-handle" />
        </Resizable>
      </Modal>
    );
  }
}
SheetSelector.displayName = "SheetSelector";
SheetSelector.propTypes = {
  sheets: PropTypes.arrayOf(PropTypes.object),
  propagateState: PropTypes.func,
  mergeRefresher: PropTypes.func,
  t: PropTypes.func,
};
export default withTranslation("upload")(SheetSelector);
