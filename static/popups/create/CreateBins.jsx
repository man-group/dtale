import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import * as gu from "../../dtale/gridUtils";

function validateBinsCfg(cfg) {
  const { col, bins, labels } = cfg;
  if (_.isNull(col)) {
    return "Missing a column selection!";
  }
  if (bins === "") {
    return "Missing a bins selection!";
  }
  if (!_.isNull(labels) && _.size(_.split(labels, ",")) != parseInt(bins)) {
    return `There are ${bins} bins, but you have only specified ${_.size(_.split(labels, ","))} labels!`;
  }
  return null;
}

function buildCode({ col, operation, bins, labels }) {
  if (_.isNull(col)) {
    return null;
  }
  let code = `pd.${operation}(df['${col.value}'], `;
  if (_.isNull(bins) || bins === "") {
    return null;
  }
  code += `${operation === "cut" ? "bins" : "q"}=${bins}`;
  if (!_.isNull(labels)) {
    if (_.size(_.split(labels, ",")) != parseInt(bins)) {
      return null;
    }
    code += `, labels=['${_.join(_.split(labels, ","), "', '")}']`;
  }
  code += ")";
  return code;
}

const BASE_STATE = { col: null, operation: "cut", bins: null, labels: null };

class CreateBins extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.assignIn({}, BASE_STATE);
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["operation", "bins", "labels"]);
    cfg.col = _.get(currState, "col.value") || null;
    const code = buildCode(currState);
    this.setState(currState, () => this.props.updateState({ cfg, code }));
  }

  render() {
    const columnOptions = _.map(
      _.filter(this.props.columns || [], c => _.includes(["int", "float"], gu.findColType(c.dtype))),
      ({ name }) => ({ value: name })
    );
    return [
      <div key={0} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Column</label>
        <div className="col-md-8">
          <div className="input-group">
            <Select
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={_.sortBy(columnOptions, o => _.toLower(o.value))}
              getOptionLabel={_.property("value")}
              getOptionValue={_.property("value")}
              value={this.state.col}
              onChange={selected => this.updateState({ col: selected })}
              noOptionsText={() => "No columns found"}
              isClearable
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
            />
          </div>
        </div>
      </div>,
      <div key={1} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Operation</label>
        <div className="col-md-8">
          <div className="btn-group">
            {_.map(
              [
                ["cut", "Cut (Evenly Spaced)"],
                ["qcut", "Qcut (Evenly Sized)"],
              ],
              ([operation, label]) => {
                const buttonProps = { className: "btn btn-primary" };
                if (operation === this.state.operation) {
                  buttonProps.className += " active";
                } else {
                  buttonProps.className += " inactive";
                  buttonProps.onClick = () => this.updateState({ operation });
                }
                return (
                  <button key={operation} {...buttonProps}>
                    {label}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>,
      <div key={2} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Bins</label>
        <div className="col-md-8">
          <input
            type="number"
            className="form-control"
            value={this.state.bins || ""}
            onChange={e => this.updateState({ bins: e.target.value })}
          />
        </div>
      </div>,
      <div key={3} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Labels</label>
        <div className="col-md-8">
          <input
            type="text"
            className="form-control"
            value={this.state.labels || ""}
            onChange={e => this.updateState({ labels: e.target.value })}
          />
        </div>
      </div>,
    ];
  }
}
CreateBins.displayName = "CreateBins";
CreateBins.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
};

export { CreateBins, validateBinsCfg };
