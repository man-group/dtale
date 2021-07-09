import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import { pivotAggs } from "../analysis/filters/Constants";
import ColumnSelect from "./ColumnSelect";

export function validateTransformCfg(t, { group, agg, col }) {
  if (!group) {
    return t("Please select a group!");
  }
  if (!col) {
    return t("Please select a column to transform!");
  }
  if (!agg) {
    return t("Please select an aggregation!");
  }
  return null;
}

export function buildCode({ group, agg, col }) {
  if (!col || !group || !agg) {
    return null;
  }

  return `df.groupby(['${_.join(group, "', '")}'])['${col}'].transform('${agg}')`;
}

class CreateTransform extends React.Component {
  constructor(props) {
    super(props);
    this.state = { group: null, col: null, agg: null };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        agg: _.get(currState, "agg.value") || null,
        col: _.get(currState, "col.value") || null,
        group: _.map(currState.group, "value") || null,
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_transform`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <ColumnSelect
          label={t("Group By")}
          prop="group"
          otherProps={["col"]}
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          isMulti
        />
        <ColumnSelect
          label={t("Col")}
          prop="col"
          otherProps={["group"]}
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["int", "float"]}
        />
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
CreateTransform.displayName = "CreateTransform";
CreateTransform.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation(["builders", "constants"])(CreateTransform);
