import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import { exports as gu } from "../../dtale/gridUtils";

class ColumnSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = { [props.prop]: _.get(props.parent, props.prop, null) };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    this.setState(state, () => this.props.updateState(state));
  }

  render() {
    const { dtypes, isMulti, label, otherProps, parent, prop } = this.props;
    let columns = this.props.columns;
    let dtypesStr = "";
    if (dtypes) {
      columns = _.filter(columns || [], c => _.includes(dtypes, gu.findColType(c.dtype)));
      dtypesStr = ` for the following dtypes: ${_.join(dtypes, ", ")}`;
    }
    let finalOptions = _.map(columns, "name");
    const otherValues = _(parent).pick(otherProps).values().flatten().map("value").compact().value();
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
              value={this.state[prop]}
              onChange={selected => this.updateState({ [prop]: selected })}
              isClearable
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
              noOptionsMessage={() => `No columns available${dtypesStr}!`}
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
  label: PropTypes.string,
  parent: PropTypes.object,
  updateState: PropTypes.func,
  dtypes: PropTypes.arrayOf(PropTypes.string),
};
ColumnSelect.defaultProps = { isMulti: false, otherProps: [] };

export default ColumnSelect;
