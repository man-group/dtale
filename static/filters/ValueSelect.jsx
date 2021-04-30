import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

class ValueSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = { selected: _.get(props, "selected", null) };
    this.updateState = this.updateState.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(this.state, prevState)) {
      return;
    }

    if (this.props.selected !== prevProps.selected) {
      this.setState({ selected: _.get(this.props, "selected", null) });
    }
  }

  updateState(state) {
    this.setState(state, () => this.props.updateState(state));
  }

  render() {
    return (
      <Select
        isMulti={this.props.isMulti}
        isDisabled={this.props.missing}
        className="Select is-clearable is-searchable Select--single"
        classNamePrefix="Select"
        options={_.map(this.props.uniques, o => ({ value: o }))}
        getOptionLabel={_.property("value")}
        getOptionValue={_.property("value")}
        value={this.state.selected}
        onChange={selected => this.updateState({ selected })}
        isClearable
        filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
      />
    );
  }
}
ValueSelect.displayName = "ValueSelect";
ValueSelect.propTypes = {
  uniques: PropTypes.array,
  missing: PropTypes.bool,
  updateState: PropTypes.func,
  selected: PropTypes.any,
  isMulti: PropTypes.bool,
};
ValueSelect.defaultProps = { isMulti: true, missing: false };

export default ValueSelect;
