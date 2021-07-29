import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

function validateTransposeCfg(cfg) {
  const { index } = cfg;
  if (!_.size(index || [])) {
    return "Missing an index selection!";
  }
  return null;
}

function buildCode({ index, columns }) {
  if (!_.size(index || [])) {
    return null;
  }
  let code = `df.set_index(['${_.join(_.map(index, "value"), "', '")}'])`;
  if (_.size(columns || [])) {
    code += `[['${_.join(_.map(columns, "value"), "', '")}']]`;
  }
  code += ".T";
  return code;
}

class Transpose extends React.Component {
  constructor(props) {
    super(props);
    this.state = { shape: _.clone(props.columns), index: null, columns: null };
    this.renderSelect = this.renderSelect.bind(this);
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["index", "columns"]);
    if (_.size(currState.index)) {
      cfg.index = _.map(currState.index, "value");
    } else {
      cfg.index = null;
    }
    if (_.size(currState.columns)) {
      cfg.columns = _.map(currState.columns, "value");
    } else {
      cfg.columns = null;
    }
    this.setState(currState, () => this.props.updateState({ cfg, code: buildCode(currState) }));
  }

  renderSelect(prop, otherProps, isMulti = false) {
    const { shape } = this.state;
    let finalOptions = _.map(shape, "name");
    let otherValues = _.pick(this.state, otherProps);
    otherValues = _.map(_.flatten(_.values(otherValues)), "value");
    otherValues = _.compact(otherValues);
    finalOptions = _.difference(finalOptions, otherValues);
    return (
      <Select
        isMulti={isMulti}
        className="Select is-clearable is-searchable Select--single"
        classNamePrefix="Select"
        options={_.map(finalOptions, o => ({ value: o }))}
        getOptionLabel={_.property("value")}
        getOptionValue={_.property("value")}
        value={this.state[prop]}
        onChange={selected => this.updateState({ [prop]: selected })}
        isClearable
        filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
      />
    );
  }

  render() {
    return [
      <div key={0} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{this.props.t("Index")}</label>
        <div className="col-md-8">
          <div className="input-group">{this.renderSelect("index", ["columns"], true)}</div>
        </div>
      </div>,
      <div key={1} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{this.props.t("Column(s)")}</label>
        <div className="col-md-8">
          <div className="input-group">{this.renderSelect("columns", ["index"], true)}</div>
        </div>
      </div>,
    ];
  }
}
Transpose.displayName = "Transpose";
Transpose.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  t: PropTypes.func,
};
const TranslateTranspose = withTranslation("reshape")(Transpose);
export { TranslateTranspose as Transpose, validateTransposeCfg, buildCode };
