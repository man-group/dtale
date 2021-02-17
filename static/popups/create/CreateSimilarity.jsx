import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import ColumnSelect from "./ColumnSelect";

const algos = t => [
  { value: "levenshtein", label: t("Levenshtein") },
  { value: "damerau-leveneshtein", label: t("Damerau-Leveneshtein") },
  { value: "jaro-winkler", label: t("Jaro-Winkler") },
  { value: "jaccard", label: t("Jaccard Index") },
];

export function validateSimilarityCfg(t, { left, right, k, algo }) {
  if (!left) {
    return t("Please select a left column!");
  }
  if (!right) {
    return t("Please select a right column!");
  }
  if (algo === "jaccard" && (!k || parseInt(k) < 1)) {
    return t("Please select a valid value for k!");
  }
  return null;
}

function buildNormalizedCode(code, normalized) {
  if (normalized) {
    return _.concat(["from dtale.column_builders import SimilarityNormalizeWrapper"], code, [
      "similarity = SimilarityNormalizeWrapper(similarity)",
    ]);
  }
  return code;
}

export function buildCode({ left, right, algo, k, normalized }) {
  if (!left || !right) {
    return null;
  }
  if (algo === "jaccard" && (_.isNull(k) || k === "" || parseInt(k) < 1)) {
    return null;
  }
  let code = [];
  if (algo === "levenshtein") {
    const packageName = normalized ? "normalized_levenshtein" : "levenshtein";
    const className = normalized ? "NormalizedLevenshtein" : "Levenshtein";
    code.push(`from strsimpy.${packageName} import ${className}`);
    code.push(`similarity = ${className}()`);
  } else if (algo === "damerau-leveneshtein") {
    code = _.concat(
      code,
      buildNormalizedCode(["from strsimpy.damerau import Damerau", "similarity = Damerau()"], normalized)
    );
  } else if (algo === "jaro-winkler") {
    code.push("from strsimpy.jaro_winkler import JaroWinkler");
    code.push("similarity = JaroWinkler()");
  } else if (algo === "jaccard") {
    code = _.concat(
      code,
      buildNormalizedCode(["from strsimpy.jaccard import Jaccard", `similarity = Jaccard(${k})`], normalized)
    );
  }

  code.push(`df[['${left}', '${right}']].fillna('').apply(lambda rec: similarity.distance(*rec), axis=1)`);
  return code;
}

class CreateSimilarity extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      left: null,
      right: null,
      algo: algos(props.t)[0],
      k: "3",
      normalized: false,
    };
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
    if (updatedState.cfg.algo !== "jaro-winkler") {
      updatedState.cfg.normalized = currState.normalized;
    }
    updatedState.code = buildCode(updatedState.cfg);
    if (validateSimilarityCfg(this.props.t, updatedState.cfg) === null && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.left}_${updatedState.cfg.right}_distance`;
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
          label={t("Left")}
          prop="left"
          otherProps={["right"]}
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["string"]}
        />
        <ColumnSelect
          label={t("Right")}
          prop="right"
          otherProps={["left"]}
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["string"]}
        />
        {_.get(this.state, "algo.value") !== "jaro-winkler" && (
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t("Normalized")}</label>
            <div className="col-md-8 mt-auto mb-auto">
              <i
                className={`ico-check-box${this.state.normalized ? "" : "-outline-blank"} pointer`}
                onClick={() => this.updateState({ normalized: !this.state.normalized })}
              />
            </div>
          </div>
        )}
        {_.get(this.state, "algo.value") === "jaccard" && (
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t("n-gram")}</label>
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
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateSimilarity);
