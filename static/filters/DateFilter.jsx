import $ from "jquery";
import _ from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { DateInput } from "@blueprintjs/datetime";

require("@blueprintjs/core/lib/css/blueprint.css");
require("@blueprintjs/datetime/lib/css/blueprint-datetime.css");

class DateFilter extends React.Component {
  constructor(props) {
    super(props);
    const previousSelection = _.get(props.columnFilters, [props.selectedCol, "value"], {});
    let state = _.pick(props, ["min", "max"]);
    state.start = previousSelection.start || state.min;
    state.end = previousSelection.end || state.max;
    state = _.mapValues(state, v => (_.isNull(v) ? null : new Date(moment(v))));
    this.state = state;
    this.updateState = this.updateState.bind(this);
  }

  updateState(prop, value) {
    const inputRef = this[`${prop}Input`];
    const inputRefValue = $(inputRef)[0].value;
    if (inputRefValue.length > 0 && inputRefValue.length < 8) {
      return;
    }
    let cfgVal = _.assignIn({}, _.pick(this.state, ["start", "end"]), {
      [prop]: value,
    });
    cfgVal = _.mapValues(cfgVal, v => (_.isNull(v) ? v : moment(v).format("YYYYMMDD")));
    let cfg = null;
    if (!_.isNull(cfgVal.start) || !_.isNull(cfgVal.end)) {
      cfg = _.assignIn({ type: "date" }, cfgVal);
    }
    this.setState({ [prop]: value }, () => this.props.updateState(cfg));
  }

  render() {
    const { start, end } = this.state;
    const inputProps = {
      formatDate: date => moment(date).format("YYYYMMDD"),
      parseDate: str => new Date(moment(str)),
      placeholder: "YYYYMMDD",
      popoverProps: { usePortal: false },
      minDate: this.state.min,
      maxDate: this.state.max,
      showActionsBar: false,
      disabled: this.props.missing,
    };
    return [
      <DateInput
        key={0}
        value={_.isNull(start) ? null : new Date(moment(start))}
        onChange={date => this.updateState("start", date)}
        inputProps={{ inputRef: c => (this.startInput = c) }}
        {...inputProps}
      />,
      <span key={1}>{this.props.t("to")}</span>,
      <DateInput
        key={2}
        value={_.isNull(end) ? null : new Date(moment(end))}
        onChange={date => this.updateState("end", date)}
        inputProps={{ inputRef: c => (this.endInput = c) }}
        {...inputProps}
      />,
    ];
  }
}
DateFilter.displayName = "DateFilter";
DateFilter.propTypes = {
  selectedCol: PropTypes.string,
  dataId: PropTypes.string.isRequired,
  columnFilters: PropTypes.object,
  updateState: PropTypes.func,
  min: PropTypes.string,
  max: PropTypes.string,
  missing: PropTypes.bool,
  t: PropTypes.func,
};
export default withTranslation("column_filter")(DateFilter);
