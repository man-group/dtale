import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import ColumnSelect from "./create/ColumnSelect";

const BASE_RANGE = {
  isEquals: false,
  equals: null,
  isGreaterThan: false,
  greaterThan: null,
  isLessThan: false,
  lessThan: null,
};
const allOption = t => ({
  name: "all",
  value: "all",
  label: t("range_highlight:Apply To All Columns"),
  dtype: "int",
});
const MODES = [
  ["Equals", "isEquals", "equals", (val, equals) => val === equals],
  ["Greater Than", "isGreaterThan", "greaterThan", (val, greaterThan) => val > greaterThan],
  ["Less Than", "isLessThan", "lessThan", (val, lessThan) => val < lessThan],
];

function retrieveRange(col, ranges) {
  const range = _.get(ranges, col.value);
  if (range) {
    _.forEach(MODES, ([_label, _flag, value, _filter]) => {
      if (!_.isNil(range[value])) {
        range[value] = range[value] + "";
      }
    });
    return range;
  }
  return { ...BASE_RANGE };
}

function rangeAsStr({ isEquals, equals, isGreaterThan, greaterThan, isLessThan, lessThan }) {
  const subRanges = [];
  if (isEquals) {
    subRanges.push(`Equals ${equals}`);
  }
  if (isGreaterThan) {
    subRanges.push(`Greater Than ${greaterThan}`);
  }
  if (isLessThan) {
    subRanges.push(`Less Than ${lessThan}`);
  }
  return _.join(subRanges, " or ");
}

class ReactRangeHighlight extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ranges: _.get(props, "chartData.rangeHighlight", {}),
      col: allOption(props.t),
    };
    this.state.currRange = retrieveRange(allOption(props.t), this.state.ranges);
    this.updateHighlights = this.updateHighlights.bind(this);
    this.applyRange = this.applyRange.bind(this);
    this.removeRange = this.removeRange.bind(this);
    this.toggleRange = this.toggleRange.bind(this);
  }

  updateHighlights(rangeState) {
    const currRange = _.assignIn({}, this.state.currRange, rangeState);
    this.setState({ currRange });
  }

  applyRange() {
    const { ranges, col, currRange } = this.state;
    const updatedRange = { ...currRange, active: true };
    let backgroundMode = {};
    _.forEach(MODES, ([_label, flag, value, _filter]) => {
      if (currRange[flag] && !_.isNil(currRange[value])) {
        updatedRange[value] = parseFloat(updatedRange[value]);
        backgroundMode = { backgroundMode: "range", triggerBgResize: true };
      }
    });
    const rangeHighlight = { ...ranges, [col.value]: updatedRange };
    if (_.get(this.props, "chartData.backgroundMode") === "range" && !_.has(backgroundMode, "backgroundMode")) {
      backgroundMode.backgroundMode = null;
    }
    this.setState({ ranges: rangeHighlight }, () => this.props.propagateState({ ...backgroundMode, rangeHighlight }));
  }

  removeRange(col) {
    const ranges = { ...this.state.ranges };
    delete ranges[col];
    const props = {
      backgroundMode: "range",
      triggerBgResize: true,
      rangeHighlight: ranges,
    };
    this.setState({ ranges }, () => this.props.propagateState(props));
  }

  toggleRange(col) {
    const ranges = { ...this.state.ranges };
    ranges[col].active = !ranges[col].active;
    const props = {
      backgroundMode: "range",
      triggerBgResize: true,
      rangeHighlight: ranges,
    };
    this.setState({ ranges }, () => this.props.propagateState(props));
  }

  render() {
    const cols = _.concat([allOption(this.props.t)], _.get(this.props, "chartData.columns", []));
    const setCol = ({ col }) => {
      const currRange = retrieveRange(col, this.state.ranges);
      this.setState({ col: col, currRange });
    };
    return (
      <div key="body" className="modal-body">
        <ColumnSelect
          label="Col"
          prop="col"
          parent={this.state}
          updateState={setCol}
          columns={cols}
          dtypes={["int", "float"]}
        />
        {_.map(MODES, ([label, flag, value, _filter], i) => (
          <div key={i} className="form-group row">
            <label className="col-md-4 col-form-label text-right">
              <i
                className={`ico-check-box${this.state.currRange[flag] ? "" : "-outline-blank"} pointer mr-3 float-left`}
                onClick={() => this.updateHighlights({ [flag]: !this.state.currRange[flag] })}
              />
              {this.props.t(`column_filter:${label}`)}
            </label>
            <div className="col-md-7">
              <input
                type="number"
                disabled={!this.state.currRange[flag]}
                className="form-control"
                value={this.state.currRange[value] || ""}
                onChange={e => this.updateHighlights({ [value]: e.target.value })}
              />
            </div>
          </div>
        ))}
        <div className="form-group row">
          <div className="col-md-4" />
          <div className="col-md-7">
            <button className="btn btn-primary float-right" onClick={this.applyRange}>
              {this.props.t("range_highlight:Apply")}
            </button>
          </div>
        </div>
        {_.map(this.state.ranges, (range, col) => (
          <div key={`range-${col}`} className="form-group row">
            <div className="col-md-1">
              <i
                className={`ico-check-box${range.active ? "" : "-outline-blank"} pointer`}
                onClick={() => this.toggleRange(col)}
              />
            </div>
            <div className="col-md-9">
              <b>{col === "all" ? allOption(this.props.t).label : col}</b>
              {`: ${rangeAsStr(range)}`}
            </div>
            <div className="col-md-2 p-0">
              <i className="ico-remove-circle pointer mt-auto mb-auto" onClick={() => this.removeRange(col)} />
            </div>
          </div>
        ))}
      </div>
    );
  }
}
ReactRangeHighlight.displayName = "RangeHighlight";
ReactRangeHighlight.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    rangeHighlight: PropTypes.object,
    backgroundMode: PropTypes.string,
  }),
  propagateState: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactRangeHighlight = withTranslation(["column_filter", "range_highlight"])(ReactRangeHighlight);
const ReduxRangeHighlight = connect(state => _.pick(state, ["chartData"]))(TranslateReactRangeHighlight);
export { TranslateReactRangeHighlight as ReactRangeHighlight, ReduxRangeHighlight as RangeHighlight, MODES };
