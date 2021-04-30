import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import AsyncSelect from "react-select/async";

import { buildURLString, columnFilterDataUrl } from "../actions/url-utils";
import { fetchJsonPromise } from "../fetcher";

class AsyncValueSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = { selected: _.get(props, "selected", null) };
    this.updateState = this.updateState.bind(this);
    this.loadOptions = this.loadOptions.bind(this);
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

  loadOptions(input) {
    return fetchJsonPromise(
      buildURLString(columnFilterDataUrl(this.props.dataId, true), {
        col: this.props.selectedCol,
        input,
      })
    );
  }

  render() {
    return (
      <AsyncSelect
        isMulti={this.props.isMulti}
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
  selected: PropTypes.any,
  isMulti: PropTypes.bool,
};
AsyncValueSelect.defaultProps = { isMulti: true, missing: false };

export default AsyncValueSelect;
