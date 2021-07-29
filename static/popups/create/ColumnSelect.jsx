import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import * as gu from "../../dtale/gridUtils";

class ColumnSelect extends React.Component {
  constructor(props) {
    super(props);
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    this.props.updateState(state);
  }

  render() {
    const { dtypes, isMulti, label, otherProps, parent, prop, t } = this.props;
    let columns = this.props.columns;
    let dtypesStr = "";
    if (dtypes) {
      columns = _.filter(columns || [], c => _.includes(dtypes, gu.findColType(c.dtype)));
      dtypesStr = ` ${t("for the following dtypes")}: ${_.join(dtypes, ", ")}`;
    }
    let finalOptions = _.map(columns, "name");
    let otherValues = _.pick(parent, otherProps);
    otherValues = _.map(_.flatten(_.values(otherValues)), "value");
    otherValues = _.compact(otherValues);
    finalOptions = _.difference(finalOptions, otherValues);
    return (
      <div key={prop} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{label || prop}</label>
        <div className="col-md-8">
          <div className="input-group">
            <Select
              isMulti={isMulti}
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={_.map(
                _.sortBy(finalOptions, o => _.toLower(o)),
                o => ({ value: o, label: _.find(columns, { name: o }).label })
              )}
              getOptionLabel={o => o.label ?? o.value}
              getOptionValue={_.property("value")}
              value={_.get(this.props.parent, this.props.prop, null)}
              onChange={selected => this.updateState({ [prop]: selected })}
              isClearable
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
              noOptionsMessage={() => `${t("No columns available")}${dtypesStr}!`}
            />
          </div>
        </div>
      </div>
    );
  }
}
ColumnSelect.displayName = "ColumnSelect";
ColumnSelect.propTypes = {
  columns: PropTypes.array,
  isMulti: PropTypes.bool,
  otherProps: PropTypes.arrayOf(PropTypes.string),
  prop: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  parent: PropTypes.object,
  updateState: PropTypes.func,
  dtypes: PropTypes.arrayOf(PropTypes.string),
  t: PropTypes.func,
};
ColumnSelect.defaultProps = { isMulti: false, otherProps: [] };

export default withTranslation("builders")(ColumnSelect);
