import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import ColumnSelect from "./ColumnSelect";

const algos = t => [
  { value: "power", label: t("PowerTransformer") },
  { value: "quantile", label: t("QuantileTransformer") },
  { value: "robust", label: t("RobustScalar") },
];

export function validateStandardizedCfg(t, { col }) {
  if (!col) {
    return t("Please select a column!");
  }
  return null;
}

export function buildCode({ col, algo }) {
  if (!col) {
    return null;
  }
  const code = [];
  if (algo === "robust") {
    code.push("from sklearn.preprocessing import Robustscalar");
    code.push("transformer = Robustscalar()");
  } else if (algo === "quantile") {
    code.push("from sklearn.preprocessing import QuantileTransformer");
    code.push("transformer = QuantileTransformer()");
  } else if (algo === "power") {
    code.push("from sklearn.preprocessing import PowerTransformer");
    code.push("transformer = PowerTransformer(method='yeo-johnson', standardize=True)");
  }

  code.push(`transformer.fit_transform(df[['${col}']]).reshape(-1)`);
  return code;
}

class CreateStandardized extends React.Component {
  constructor(props) {
    super(props);
    this.state = { col: null, algo: algos(props.t)[0] };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        col: _.get(currState, "col.value") || null,
        algo: _.get(currState, "algo.value"),
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (validateStandardizedCfg(this.props.t, updatedState.cfg) === null && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_${updatedState.cfg.algo}`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Aggregation")}</label>
          <div className="col-md-8">
            <div className="input-group">
              <Select
                className="Select is-clearable is-searchable Select--single"
                classNamePrefix="Select"
                options={algos(t)}
                getOptionLabel={_.property("label")}
                getOptionValue={_.property("value")}
                value={this.state.algo}
                onChange={algo => this.updateState({ algo })}
                isClearable
                filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
              />
            </div>
          </div>
        </div>
        <ColumnSelect
          label={t("Column")}
          prop="col"
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["int", "float"]}
        />
      </React.Fragment>
    );
  }
}
CreateStandardized.displayName = "CreateStandardized";
CreateStandardized.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateStandardized);
