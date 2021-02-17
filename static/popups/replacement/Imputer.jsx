import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

function validateImputerCfg(t, { type }) {
  if (_.isNull(type)) {
    return t("Please select an imputer!");
  }
  return null;
}

function buildCode(col, cfg) {
  const { type, nNeighbors } = cfg;
  const code = [];
  if (type == "iterative") {
    code.push("from sklearn.experimental import enable_iterative_imputer");
    code.push("from sklearn.impute import IterativeImputer");
    code.push("");
    code.push(`output = IterativeImputer().fit_transform(df[['${col}']])`);
  } else if (type === "knn") {
    code.push("from sklearn.impute import KNNImputer");
    code.push("");
    code.push(`output = KNNImputer(n_neighbors=${nNeighbors ?? 2}).fit_transform(df[['${col}']])`);
  } else if (type === "simple") {
    code.push("from sklearn.impute import SimpleImputer");
    code.push("");
    code.push(`output = SimpleImputer().fit_transform(df[['${col}']])`);
  }
  code.push(`df.loc[:, '${col}'] = pd.DataFrame(output, columns=['${col}'], index=df.index)['${col}']`);
  return code;
}

class Imputer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { type: null, nNeighbors: null };
    this.updateState = this.updateState.bind(this);
    this.renderImputerInputs = this.renderImputerInputs.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const props = ["type"];
    if (currState.type === "knn") {
      props.push("nNeighbors");
    }
    let cfg = _.pick(currState, props);
    cfg = _.pickBy(cfg, _.identity);
    this.setState(currState, () =>
      this.props.updateState({
        cfg,
        code: buildCode(this.props.col, currState),
      })
    );
  }

  renderImputerInputs() {
    if (this.state.type !== "knn") {
      return null;
    }
    return (
      <div key={1} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{this.props.t("Neighbors")}</label>
        <div className="col-md-8">
          <input
            type="number"
            className="form-control"
            value={this.state.nNeighbors ?? ""}
            onChange={e => this.updateState({ nNeighbors: e.target.value })}
          />
          <small>{this.props.t("Default")}: 2</small>
        </div>
      </div>
    );
  }

  render() {
    return [
      <div key={0} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{this.props.t("Data Type")}</label>
        <div className="col-md-8">
          <div className="btn-group">
            {_.map(
              [
                ["iterative", "Iterative"],
                ["knn", "KNN"],
                ["simple", "Simple"],
              ],
              ([type, label]) => {
                const buttonProps = { className: "btn btn-primary" };
                if (type === this.state.type) {
                  buttonProps.className += " active";
                } else {
                  buttonProps.className += " inactive";
                  buttonProps.onClick = () => this.updateState({ type });
                }
                return (
                  <button key={`imputer-${type}`} {...buttonProps}>
                    {this.props.t(label)}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>,
      this.renderImputerInputs(),
    ];
  }
}
Imputer.displayName = "Imputer";
Imputer.propTypes = {
  updateState: PropTypes.func,
  col: PropTypes.string,
  t: PropTypes.func,
};
const TranslateImputer = withTranslation("replacement")(Imputer);
export { TranslateImputer as Imputer, validateImputerCfg, buildCode };
