import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import ColumnSelect from "./ColumnSelect";

export function validateStringSplittingCfg(t, cfg) {
  if (!cfg.col) {
    return t("Missing a column selection!");
  }
  if (!cfg.delimiter) {
    return t("Please input a delimiter!");
  }
  return null;
}

export function buildCode({ col, delimiter }) {
  if (_.isNull(col)) {
    return null;
  }
  if (!delimiter) {
    return null;
  }
  return `df['${col}'].str.split('${delimiter}', expand=True)`;
}

class CreateStringSplitting extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      col: null,
      delimiter: "",
    };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const col = _.get(currState, "col.value") || null;
    const updatedState = {
      cfg: {
        col,
        delimiter: currState.delimiter,
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_split`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <ColumnSelect
          label={`${t("Column")}*`}
          prop="col"
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["string"]}
        />
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Delimiter")}</label>
          <div className="col-md-8">
            <input
              type="text"
              className="form-control"
              value={this.state.delimiter || ""}
              onChange={e => this.updateState({ delimiter: e.target.value })}
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
CreateStringSplitting.displayName = "CreateStringSplitting";
CreateStringSplitting.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateStringSplitting);
