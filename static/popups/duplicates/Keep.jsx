import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

class Keep extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: { value: props.value || "first" } };
    this.updateState = this.updateState.bind(this);
  }

  updateState(value) {
    this.setState({ value }, this.props.updateState({ keep: _.get(value, "value") }));
  }

  render() {
    return (
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{this.props.t("Keep")}</label>
        <div className="col-md-8">
          <Select
            className="Select is-clearable is-searchable Select--single"
            classNamePrefix="Select"
            options={_.map(
              _.sortBy(["first", "last", "none"], o => _.toLower(o)),
              o => ({ value: o })
            )}
            getOptionLabel={v => this.props.t(_.capitalize(v.value))}
            getOptionValue={_.property("value")}
            value={this.state.value}
            onChange={selected => this.updateState(selected)}
            isClearable
            filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons
          />
        </div>
      </div>
    );
  }
}
Keep.displayName = "Keep";
Keep.propTypes = {
  value: PropTypes.string,
  updateState: PropTypes.func,
  t: PropTypes.func,
};
export default withTranslation("duplicate")(Keep);
