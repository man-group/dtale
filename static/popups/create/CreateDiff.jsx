import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import ColumnSelect from "./ColumnSelect";

export function validateDiffCfg(t, { col, periods }) {
  if (!col) {
    return t("Please select a column!");
  }
  if (!periods || !parseInt(periods)) {
    return t("Please select a valid value for periods!");
  }
  return null;
}

export function buildCode({ col, periods }) {
  if (!col) {
    return null;
  }
  if (!periods || !parseInt(periods)) {
    return null;
  }

  return `df['${col}'].diff(${periods})`;
}

class CreateDiff extends React.Component {
  constructor(props) {
    super(props);
    this.state = { periods: "1", col: null };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        col: _.get(currState, "col.value") || null,
        periods: currState.periods,
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_diff`;
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
          <label className="col-md-3 col-form-label text-right">{t("Periods")}</label>
          <div className="col-md-8">
            <input
              className="form-control"
              value={this.state.periods}
              onChange={e => this.updateState({ periods: e.target.value })}
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
CreateDiff.displayName = "CreateDiff";
CreateDiff.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateDiff);
