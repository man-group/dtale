import qs from "querystring";

import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import AsyncSelect from "react-select/async";

import { fetchJsonPromise } from "../fetcher";

class AsyncValueSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = { selected: _.get(props, "selected", null) };
    this.updateState = this.updateState.bind(this);
    this.loadOptions = this.loadOptions.bind(this);
  }

  updateState(state) {
    this.setState(state, () => this.props.updateState(state));
  }

  loadOptions(input) {
    return fetchJsonPromise(
      `/dtale/async-column-filter-data/${this.props.dataId}/${this.props.selectedCol}?${qs.stringify({ input })}`
    );
  }

  render() {
    return (
      <AsyncSelect
        isMulti
        isDisabled={this.props.missing}
        className="Select is-clearable is-searchable Select--single"
        classNamePrefix="Select"
        getOptionLabel={_.property("value")}
        getOptionValue={_.property("value")}
        value={this.state.selected}
        onChange={selected => this.updateState({ selected })}
        isClearable
        cacheOptions
        defaultOptions={_.map(this.props.uniques, u => ({ value: u }))}
        loadOptions={this.loadOptions}
      />
    );
  }
}
AsyncValueSelect.displayName = "AsyncValueSelect";
AsyncValueSelect.propTypes = {
  uniques: PropTypes.array,
  missing: PropTypes.bool,
  updateState: PropTypes.func,
  dataId: PropTypes.string,
  selectedCol: PropTypes.string,
};

export default AsyncValueSelect;
