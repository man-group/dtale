import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

function validateSpacesCfg(t, { replace }) {
  if (_.isNull(replace) || "") {
    return t("Please enter a replacement value!");
  }
  return null;
}

function buildCode(col, { replace }) {
  if (_.isNull(replace) || "") {
    return null;
  }
  let replaceVal = replace;
  if (_.toLower(replaceVal) === "nan") {
    replaceVal = "np.nan";
  } else {
    replaceVal = `'${replaceVal}'`;
  }
  return `df.loc[:, '${col}'] = df['${col}'].replace(r'^\\\\s+$', ${replaceVal}, regex=True)`;
}

class Spaces extends React.Component {
  constructor(props) {
    super(props);
    this.state = { replace: "nan" };
    this.updateState = this.updateState.bind(this);
  }

  componentDidMount() {
    // this is because when we initialize "Spaces" we already have enough state for a cfg
    this.updateState({});
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["replace"]);
    this.setState(currState, () =>
      this.props.updateState({
        cfg,
        code: buildCode(this.props.col, currState),
      })
    );
  }

  render() {
    return (
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{this.props.t("Replace With")}</label>
        <div className="col-md-8">
          <input
            type="text"
            className="form-control"
            value={this.state.replace || ""}
            onChange={e => this.updateState({ replace: e.target.value })}
          />
          <small>{this.props.t("replace_missings")}</small>
        </div>
      </div>
    );
  }
}
Spaces.displayName = "Spaces";
Spaces.propTypes = {
  updateState: PropTypes.func,
  col: PropTypes.string,
  t: PropTypes.func,
};
const TranslateSpaces = withTranslation("replacement")(Spaces);
export { TranslateSpaces as Spaces, validateSpacesCfg, buildCode };
