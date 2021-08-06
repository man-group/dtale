import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import * as gu from "../../dtale/gridUtils";

class Operand extends React.Component {
  constructor(props) {
    super(props);
    this.updateState = this.updateState.bind(this);
  }

  updateState(newCfg) {
    const { updateState, name, cfg } = this.props;
    updateState({ [name]: { ...cfg, ...newCfg } });
  }

  render() {
    const { colTypes, cfg, dataType, otherOperand, t } = this.props;
    const { col, type, val } = cfg;
    let input = null;
    if (type === "col") {
      const columns = _.map(
        _.filter(this.props.columns || [], c => (colTypes ? _.includes(colTypes, gu.findColType(c.dtype)) : true)),
        ({ name }) => ({ value: name })
      );
      const otherCol = otherOperand.type === "col" ? otherOperand.col : null;
      const finalOptions = _.isNull(otherCol) ? columns : _.reject(columns, otherCol);
      input = (
        <div className="input-group">
          <Select
            className="Select is-clearable is-searchable Select--single"
            classNamePrefix="Select"
            options={_.sortBy(finalOptions, o => _.toLower(o.value))}
            getOptionLabel={_.property("value")}
            getOptionValue={_.property("value")}
            value={col}
            onChange={selected => this.updateState({ col: selected })}
            noOptionsText={() => t("No columns found")}
            isClearable
            filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
          />
        </div>
      );
    } else {
      const onChange = e => this.updateState({ val: e.target.value });
      input = (
        <div className="input-group">
          <input type={dataType} className="form-control numeric-input" value={val || ""} onChange={onChange} />
        </div>
      );
    }
    return (
      <div className="form-group row">
        <div className="col-md-3 text-right">
          <div className="btn-group">
            {_.map(["col", "val"], val => {
              const buttonProps = { className: "btn" };
              if (val === type) {
                buttonProps.className += " btn-primary active";
              } else {
                buttonProps.className += " btn-primary inactive";
                buttonProps.onClick = () => this.updateState({ type: val });
              }
              return (
                <button key={val} {...buttonProps}>
                  {t(_.capitalize(val))}
                </button>
              );
            })}
          </div>
        </div>
        <div className="col-md-8">{input}</div>
      </div>
    );
  }
}
Operand.displayName = "Operand";
Operand.propTypes = {
  name: PropTypes.string,
  cfg: PropTypes.object,
  otherOperand: PropTypes.object,
  dataType: PropTypes.string,
  colTypes: PropTypes.array,
  updateState: PropTypes.func,
  columns: PropTypes.array,
  t: PropTypes.func,
};

export default withTranslation("builders")(Operand);
