import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

class StringFilter extends React.Component {
  constructor(props) {
    super(props);
    const selected = _.map(_.get(props.columnFilters, [props.selectedCol, "value"], null), v => ({ value: v }));
    this.state = { selected: selected };
    this.updateState = this.updateState.bind(this);
  }

  updateState(selected) {
    const cfg = { type: "string", value: _.map(selected || [], "value") };
    this.setState({ selected }, () => this.props.updateState(cfg));
  }

  render() {
    return (
      <Select
        isMulti
        isDisabled={this.props.missing}
        className="Select is-clearable is-searchable Select--single"
        classNamePrefix="Select"
        options={_.map(this.props.uniques, o => ({ value: o }))}
        getOptionLabel={_.property("value")}
        getOptionValue={_.property("value")}
        value={this.state.selected}
        onChange={this.updateState}
        isClearable
        filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
      />
    );
  }
}
StringFilter.displayName = "StringFilter";
StringFilter.propTypes = {
  selectedCol: PropTypes.string,
  columnFilters: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  updateState: PropTypes.func,
  uniques: PropTypes.array,
  missing: PropTypes.bool,
};

export { StringFilter };
