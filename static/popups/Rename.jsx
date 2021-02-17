import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { RemovableError } from "../RemovableError";
import { closeChart } from "../actions/charts";
import serverState from "../dtale/serverStateManagement";

require("./Confirmation.css");

class ReactRename extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: _.get(props, "chartData.selectedCol", ""),
      error: null,
    };
    this.updateName = this.updateName.bind(this);
  }

  updateName(name) {
    const { selectedCol, columns } = this.props.chartData;
    if (name !== selectedCol && _.find(columns, { name })) {
      this.setState({
        error: <RemovableError error={`Column with name "${name}" already exists!`} />,
      });
      return;
    }
    this.setState({ name });
  }

  render() {
    const { dataId, propagateState, onClose, t } = this.props;
    const { selectedCol, columns } = this.props.chartData;
    const rename = this.state.name;
    const renameAction = () => {
      const callback = data => {
        if (data.error) {
          this.setState({ error: <RemovableError {...data} /> });
          return;
        }
        const updatedColumns = _.map(columns, c => _.assignIn({}, c, c.name === selectedCol ? { name: rename } : {}));
        const renameUpdate = data =>
          _.mapValues(data, d => {
            const newRecord = _.assignIn(d, { [rename]: d[selectedCol] });
            delete newRecord[selectedCol];
            return newRecord;
          });
        propagateState({ columns: updatedColumns, renameUpdate });
        onClose();
      };
      serverState.renameColumn(dataId, selectedCol, rename, callback);
    };
    return [
      <div key="body" className="modal-body">
        {this.state.error}
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">{t("Current")}</label>
          <div className="col-md-6 mt-auto mb-auto font-weight-bold">{selectedCol}</div>
        </div>
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">{t("New")}</label>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              value={this.state.name}
              onChange={e => this.updateName(e.target.value)}
            />
          </div>
        </div>
      </div>,
      <div key="footer" className="modal-footer confirmation">
        <button className="btn btn-primary" onClick={renameAction}>
          <span>{t("Update")}</span>
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          <span>{t("Cancel")}</span>
        </button>
      </div>,
    ];
  }
}
ReactRename.displayName = "Rename";
ReactRename.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    selectedCol: PropTypes.string,
    columns: PropTypes.arrayOf(PropTypes.object),
  }),
  propagateState: PropTypes.func,
  dataId: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactRename = withTranslation("rename")(ReactRename);
const ReduxRename = connect(
  state => _.pick(state, ["chartData"]),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(TranslateReactRename);
export { TranslateReactRename as ReactRename, ReduxRename as Rename };
