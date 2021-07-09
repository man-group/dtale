import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import { pivotAggs } from "../analysis/filters/Constants";
import ColumnSelect from "./ColumnSelect";

export function validateExpandingCfg(t, { col, agg }) {
  if (!col) {
    return t("Please select a column!");
  }
  if (!agg) {
    return t("Please select an aggregation!");
  }
  return null;
}

export function buildCode({ col, periods, agg }) {
  if (!col || !agg) {
    return null;
  }
  return `df['${col}'].expanding(${periods || 1}).${agg}()`;
}

class CreateExpanding extends React.Component {
  constructor(props) {
    super(props);
    this.state = { col: null, periods: 1 };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        col: _.get(currState, "col.value") || null,
        periods: currState.periods,
        agg: _.get(currState, "agg.value") || null,
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_expansion`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <ColumnSelect
          label={t("Col")}
          prop="col"
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["int", "float"]}
        />
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Min Periods")}</label>
          <div className="col-md-8">
            <input
              type="number"
              className="form-control"
              value={this.state.periods}
              onChange={e => this.updateState({ periods: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Aggregation")}</label>
          <div className="col-md-8">
            <div className="input-group">
              <Select
                className="Select is-clearable is-searchable Select--single"
                classNamePrefix="Select"
                options={pivotAggs(t)}
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
CreateExpanding.displayName = "CreateExpanding";
CreateExpanding.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateExpanding);
