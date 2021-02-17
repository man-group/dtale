import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import ColumnSelect from "./ColumnSelect";

export function validateDataSlopeCfg(t, { col }) {
  if (!col) {
    return t("Please select a column!");
  }
  return null;
}

export function buildCode({ col }) {
  if (!col) {
    return null;
  }

  return [
    `diffs = df['${col}'].diff().bfill()`,
    "diffs.loc[diffs < 0] = -1",
    "g = (~(diffs == diffs.shift(1))).cumsum()",
  ];
}

class CreateDataSlope extends React.Component {
  constructor(props) {
    super(props);
    this.state = { col: null };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        col: _.get(currState, "col.value") || null,
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_data_slope`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    return (
      <ColumnSelect
        label={this.props.t("Col")}
        prop="col"
        parent={this.state}
        updateState={this.updateState}
        columns={this.props.columns}
        dtypes={["int", "float"]}
      />
    );
  }
}
CreateDataSlope.displayName = "CreateDataSlope";
CreateDataSlope.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateDataSlope);
