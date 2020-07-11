import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

class FilterSelect extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { selectProps, labelProp } = this.props;
    return (
      <Select
        className="Select is-clearable is-searchable Select--single"
        classNamePrefix="Select"
        getOptionLabel={_.property(labelProp)}
        getOptionValue={_.property("value")}
        filterOption={createFilter({ ignoreAccents: false })}
        {...selectProps}
      />
    );
  }
}
FilterSelect.displayName = "FilterSelect";
FilterSelect.propTypes = {
  selectProps: PropTypes.object,
  labelProp: PropTypes.string,
};
FilterSelect.defaultProps = { labelProp: "value" };

export default FilterSelect;
