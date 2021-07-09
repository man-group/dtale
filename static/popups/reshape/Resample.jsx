import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import { resampleAggs } from "../analysis/filters/Constants";
import ColumnSelect from "../create/ColumnSelect";

const OFFSET_URL = "https://pandas.pydata.org/pandas-docs/stable/user_guide/timeseries.html#offset-aliases";

function validateResampleCfg(cfg) {
  const { index, freq, agg } = cfg;
  if (!_.size(index || [])) {
    return "Missing an index selection!";
  }
  if (!freq) {
    return "Missing offset!";
  }
  if (!agg) {
    return "Missing aggregation!";
  }
  return null;
}

function buildCode({ index, columns, freq, agg }) {
  if (!index) {
    return null;
  }
  if (!freq) {
    return null;
  }
  if (!agg) {
    return null;
  }
  let code = `df.set_index(['${_.get(index, "value")}'])`;
  if (_.size(columns || [])) {
    code += `[['${_.join(_.map(columns, "value"), "', '")}']]`;
  }
  code += `.resample('${freq}').${_.get(agg, "value")}()`;
  return code;
}

class Resample extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shape: _.clone(props.columns),
      index: null,
      columns: null,
      freq: "",
      agg: null,
    };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["index", "columns", "freq", "agg"]);
    cfg.index = _.get(currState.index, "value");
    if (_.size(currState.columns)) {
      cfg.columns = _.map(currState.columns, "value");
    } else {
      cfg.columns = null;
    }
    cfg.agg = _.get(currState.agg, "value");
    this.setState(currState, () => this.props.updateState({ cfg, code: buildCode(currState) }));
  }

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <ColumnSelect
          label={t("reshape:Index")}
          prop="index"
          parent={this.state}
          updateState={this.updateState}
          columns={this.state.shape}
          dtypes={["date"]}
        />
        <ColumnSelect
          label={t("reshape:Columns")}
          prop="columns"
          parent={this.state}
          updateState={this.updateState}
          columns={this.state.shape}
          dtypes={["int", "float"]}
          isMulti={true}
        />
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("reshape:Offset")}</label>
          <div className="col-md-8">
            <input
              type="text"
              className="form-control"
              value={this.state.freq || ""}
              onChange={e => this.updateState({ freq: e.target.value })}
            />
            <small>
              {t("Examples of pandas offset aliases found ")}
              <a href={OFFSET_URL} rel="noopener noreferrer" target="_blank">
                here
              </a>
            </small>
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("reshape:Aggregation")}</label>
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
      </React.Fragment>
    );
  }
}
Resample.displayName = "Resample";
Resample.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  t: PropTypes.func,
};
const TranslateResample = withTranslation(["reshape", "constants"])(Resample);
export { TranslateResample as Resample, Resample as ReactResample, validateResampleCfg, buildCode };
