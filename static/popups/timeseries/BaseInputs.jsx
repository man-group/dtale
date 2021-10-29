import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import { resampleAggs } from "../analysis/filters/Constants";
import ColumnSelect from "../create/ColumnSelect";

export function validate(cfg) {
  const { index, col } = cfg;
  if (!_.size(index || [])) {
    return "Missing an index selection!";
  }
  if (!col) {
    return "Missing a column selection!";
  }
  return null;
}

export function buildCode(index, col, agg) {
  if (agg) {
    return `s = df.groupby('${index}')['${col}'].${agg}()`;
  }
  return `s = df.set_index('${index}')['${col}']`;
}

export class ReactBaseInputs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      columns: _.clone(props.columns),
      index: props.cfg?.index ? { value: props.cfg.index } : null,
      col: props.cfg?.col ? { value: props.cfg.col } : null,
      agg: props.cfg?.agg ? { value: props.cfg.agg } : null,
    };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["index", "col", "agg"]);
    cfg.index = _.get(currState.index, "value");
    cfg.col = _.get(currState.col, "value");
    cfg.agg = _.get(currState.agg, "value");
    this.setState(currState, () => this.props.updateState(cfg));
  }

  render() {
    const { t } = this.props;
    return (
      <>
        <div className="col-md-4">
          <ColumnSelect
            label={t("timeseries:Index")}
            prop="index"
            parent={this.state}
            updateState={this.updateState}
            columns={this.state.columns}
            dtypes={["date"]}
          />
        </div>
        <div className="col-md-4">
          <ColumnSelect
            label={t("timeseries:Column")}
            prop="col"
            parent={this.state}
            updateState={this.updateState}
            columns={this.state.columns}
            dtypes={["int", "float"]}
          />
        </div>
        <div className="col-md-4">
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t("timeseries:Agg")}</label>
            <div className="col-md-8">
              <div className="input-group">
                <Select
                  className="Select is-clearable is-searchable Select--single"
                  classNamePrefix="Select"
                  options={resampleAggs(t)}
                  getOptionLabel={_.property("label")}
                  getOptionValue={_.property("value")}
                  value={this.state.agg}
                  onChange={agg => this.updateState({ agg })}
                  isClearable
                  filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
ReactBaseInputs.displayName = "ReactBaseInputs";
ReactBaseInputs.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  t: PropTypes.func,
  cfg: PropTypes.object,
};
export const BaseInputs = withTranslation(["timeseries", "constants"])(ReactBaseInputs);
