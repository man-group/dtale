import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import ColumnSelect from "./ColumnSelect";

const ALGOS = [
  { value: "label", label: "LabelEncoder" },
  { value: "one_hot", label: "OneHotEncoder" },
  { value: "ordinal", label: "OrdinalEncoder" },
  { value: "feature_hasher", label: "FeatureHasher" },
];

function validateEncoderCfg({ col, n, algo }) {
  if (!col) {
    return "Please select a column!";
  }
  if (algo === "feature_hasher" && (!n || parseInt(n) < 1)) {
    return "Features must be an integer greater than zero!";
  }
  return null;
}

function buildCode({ col, n, algo }) {
  if (!col) {
    return null;
  }
  if (algo === "feature_hasher" && (_.isNull(n) || n === "" || parseInt(n) < 1)) {
    return null;
  }
  if (algo === "one_hot") {
    return `pd.get_dummies(df, columns=['${col}'], drop_first=True)`;
  } else if (algo === "ordinal") {
    return [
      "from sklearn.preprocessing import OrdinalEncoder",
      `is_nan = df['${col}'].isnull()`,
      `pd.Series(OrdinalEncoder().fit_transform(df[['${col}']]).reshape(-1), index=df.index).where(~is_nan, 0)`,
    ];
  } else if (algo === "label") {
    return [
      "from sklearn.preprocessing import LabelEncoder",
      `is_nan = df['${col}'].isnull()`,
      `pd.Series(LabelEncoder().fit_transform(df['${col}']), index=df.index).where(~is_nan, 0)`,
    ];
  } else if (algo === "feature_hasher") {
    return [
      "from sklearn.feature_extraction import FeatureHasher",
      `FeatureHasher(n_features=${n}, input_type='string').transform(data['${col}'].astype('str')`,
    ];
  }
  return null;
}

class CreateEncoder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      left: null,
      right: null,
      algo: ALGOS[0],
      n: "1",
      normalized: false,
    };
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
    if (updatedState.cfg.algo === "feature_hasher") {
      updatedState.cfg.n = currState.n;
    }
    updatedState.code = buildCode(updatedState.cfg);
    if (validateEncoderCfg(updatedState.cfg) === null && !this.props.namePopulated) {
      const algoKey = _.find(ALGOS, { value: updatedState.cfg.algo });
      updatedState.name = `${updatedState.cfg.col}_${_.get(algoKey, "value", updatedState.cfg.algo)}`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    return (
      <React.Fragment>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Encoder</label>
          <div className="col-md-8">
            <div className="input-group">
              <Select
                className="Select is-clearable is-searchable Select--single"
                classNamePrefix="Select"
                options={ALGOS}
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
          label="Column"
          prop="col"
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["string", "int"]}
        />
        {_.get(this.state, "algo.value") === "feature_hasher" && (
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">Features</label>
            <div className="col-md-8">
              <input
                type="number"
                className="form-control"
                value={this.state.n}
                onChange={e => this.updateState({ n: e.target.value })}
              />
            </div>
          </div>
        )}
      </React.Fragment>
    );
  }
}
CreateEncoder.displayName = "CreateEncoder";
CreateEncoder.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
};

export { CreateEncoder, validateEncoderCfg, buildCode };
