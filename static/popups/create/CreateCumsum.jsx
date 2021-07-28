import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import ColumnSelect from "./ColumnSelect";

export function validateCumsumCfg(t, { col }) {
  if (!col) {
    return t("Please select a column!");
  }
  return null;
}

export function buildCode({ col, group }) {
  if (!col) {
    return null;
  }

  if (group && group.length) {
    return `df.groupby(['${_.join(group, "', '")}'])['${col}'].cumsum(axis=0)`;
  }

  return `df['${col}'].cumsum(axis=0)`;
}

class CreateCumsum extends React.Component {
  constructor(props) {
    super(props);
    this.state = { col: null };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        group: _.map(currState.group, "value") || null,
        col: _.get(currState, "col.value") || null,
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_cumsum`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    return (
      <React.Fragment>
        <ColumnSelect
          label={this.props.t("Col")}
          prop="col"
          otherProps={["group"]}
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["int", "float"]}
        />
        <ColumnSelect
          label={this.props.t("Group By")}
          prop="group"
          otherProps={["col"]}
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          isMulti
        />
      </React.Fragment>
    );
  }
}
CreateCumsum.displayName = "CreateCumsum";
CreateCumsum.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateCumsum);
