import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import ColumnSelect from "./ColumnSelect";

const ALGOS = [
  { value: "levenshtein", label: "Levenshtein" },
  { value: "damerau-leveneshtein", label: "Damerau-Leveneshtein" },
  { value: "jaro-winkler", label: "Jaro-Winkler" },
  { value: "jaccard", label: "Jaccard Index" },
];

function validateSimilarityCfg({ left, right, k, algo }) {
  if (!left) {
    return "Please select a left column!";
  }
  if (!right) {
    return "Please select a right column!";
  }
  if (algo === "jaccard" && (!k || parseInt(k) < 1)) {
    return "Please select a valid value for k!";
  }
  return null;
}

function buildCode({ left, right, algo, k }) {
  if (!left || !right) {
    return null;
  }
  if (algo === "jaccard" && (_.isNull(k) || k === "" || parseInt(k) < 1)) {
    return null;
  }
  const code = [];
  if (algo === "levenshtein") {
    code.push("from strsimpy.levenshtein import Levenshtein");
    code.push("similarity = Levenshtein()");
  } else if (algo === "damerau-leveneshtein") {
    code.push("from strsimpy.damerau import Damerau");
    code.push("similarity = Damerau()");
  } else if (algo === "jaro-winkler") {
    code.push("from strsimpy.jaro_winkler import JaroWinkler");
    code.push("similarity = JaroWinkler()");
  } else if (algo === "jaccard") {
    code.push("from strsimpy.jaccard import Jaccard");
    code.push(`similarity = Jaccard(${k})`);
  }

  code.push(`df[['${left}', '${right}']].fillna('').apply(lambda rec: similarity.distance(*rec), axis=1)`);
  return code;
}

class CreateSimilarity extends React.Component {
  constructor(props) {
    super(props);
    this.state = { left: null, right: null, algo: ALGOS[0], k: "3" };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        left: _.get(currState, "left.value") || null,
        right: _.get(currState, "right.value") || null,
        algo: _.get(currState, "algo.value"),
      },
    };
    if (updatedState.cfg.algo === "jaccard") {
      updatedState.cfg.k = currState.k;
    }
    updatedState.code = buildCode(updatedState.cfg);
    if (validateSimilarityCfg(updatedState.cfg) === null && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.left}_${updatedState.cfg.right}_distance`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    return (
      <React.Fragment>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Aggregation</label>
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
          label="Left"
          prop="left"
          otherProps={["right"]}
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["string"]}
        />
        <ColumnSelect
          label="Right"
          prop="right"
          otherProps={["left"]}
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["string"]}
        />
        {_.get(this.state, "algo.value") === "jaccard" && (
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">n-gram</label>
            <div className="col-md-8">
              <input
                type="number"
                className="form-control"
                value={this.state.k}
                onChange={e => this.updateState({ k: e.target.value })}
              />
            </div>
          </div>
        )}
      </React.Fragment>
    );
  }
}
CreateSimilarity.displayName = "CreateSimilarity";
CreateSimilarity.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
};

export { CreateSimilarity, validateSimilarityCfg, buildCode };
