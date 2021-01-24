import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import { ROLLING_COMPS } from "../analysis/filters/Constants";
import ColumnSelect from "./ColumnSelect";

const WINDOW_TYPES = [
  { value: "triang", label: "Triangular" },
  { value: "gaussian", label: "Gaussian" },
];

function validateRollingCfg({ col, comp }) {
  if (!col) {
    return "Please select a column!";
  }
  if (!comp) {
    return "Please select a computation!";
  }
  return null;
}

function buildCode(cfg) {
  if (!cfg.col || !cfg.comp) {
    return null;
  }
  let rollingKwargs = [];
  if (cfg.min_periods) {
    rollingKwargs.push(`min_periods=${cfg.min_periods}`);
  }
  if (cfg.center) {
    rollingKwargs.push("center=True");
  }
  _.forEach(["win_type", "on", "closed"], p => {
    if (cfg[p]) {
      rollingKwargs.push(`${p}='${cfg[p]}`);
    }
  });
  rollingKwargs = _.join(rollingKwargs, ", ");
  if (rollingKwargs) {
    rollingKwargs = `, ${rollingKwargs}`;
  } else {
    rollingKwargs = "";
  }
  if (cfg.on) {
    return `df[['${cfg.col}', '${cfg.on}']].rolling(${cfg.window}${rollingKwargs}).${cfg.comp}()['${cfg.col}']`;
  }
  return `df['${cfg.col}'].rolling(${cfg.window}${rollingKwargs}).${cfg.comp}()`;
}

class CreateRolling extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      col: null,
      comp: null,
      window: "5",
      min_periods: null,
      center: false,
      win_type: null,
      on: null,
      closed: null,
    };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        col: _.get(currState, "col.value") || null,
        comp: _.get(currState, "comp.value") || null,
        window: currState.window,
        min_periods: currState.min_periods,
        center: currState.center,
        win_type: _.get(currState, "win_type.value") || null,
        on: _.get(currState, "on.value") || null,
        closed: currState.closed,
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (validateRollingCfg(updatedState.cfg) === null && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_rolling_${updatedState.cfg.comp}`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    return (
      <React.Fragment>
        <ColumnSelect
          label="Column*"
          prop="col"
          otherProps={["on"]}
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["int", "float"]}
        />
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Computation*</label>
          <div className="col-md-8">
            <div className="input-group">
              <Select
                className="Select is-clearable is-searchable Select--single"
                classNamePrefix="Select"
                options={ROLLING_COMPS}
                getOptionLabel={_.property("label")}
                getOptionValue={_.property("value")}
                value={this.state.comp}
                onChange={comp => this.updateState({ comp })}
                filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
              />
            </div>
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Window</label>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              value={this.state.window}
              onChange={e => this.updateState({ window: e.target.value })}
            />
          </div>
          <label className="col-auto col-form-label text-right">Min Periods</label>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              value={this.state.min_periods || ""}
              onChange={e => this.updateState({ min_periods: e.target.value })}
            />
          </div>
          <label className="col-auto col-form-label text-right">Center</label>
          <div className="col-md-1 mt-auto mb-auto">
            <i
              className={`ico-check-box${this.state.center ? "" : "-outline-blank"} pointer`}
              onClick={() => this.updateState({ center: !this.state.center })}
            />
          </div>
        </div>
        <ColumnSelect
          label="On"
          prop="on"
          otherProps={["col"]}
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
        />
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Window Type</label>
          <div className="col-md-3">
            <Select
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={WINDOW_TYPES}
              getOptionLabel={_.property("label")}
              getOptionValue={_.property("value")}
              value={this.state.win_type}
              onChange={selected => this.updateState({ win_type: selected })}
              isClearable
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
            />
            <small>{"* Required"}</small>
          </div>
          <label className="col-auto col-form-label text-right ml-5">Closed</label>
          <div className="col-auto">
            <div className="btn-group">
              {_.map(["right", "left", "both", "neither"], closed => {
                const buttonProps = { className: "btn btn-primary" };
                if (closed === this.state.closed) {
                  buttonProps.className += " active";
                } else {
                  buttonProps.className += " inactive";
                  buttonProps.onClick = () => this.updateState({ closed });
                }
                return (
                  <button key={closed} {...buttonProps}>
                    {_.capitalize(closed)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
CreateRolling.displayName = "CreateRolling";
CreateRolling.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
};

export { CreateRolling, validateRollingCfg, buildCode };
