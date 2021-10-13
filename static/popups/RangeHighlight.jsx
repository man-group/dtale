import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import reactCSS from "reactcss";
import { SketchPicker } from "react-color";

import ColumnSelect from "./create/ColumnSelect";
import serverState from "../dtale/serverStateManagement";

export const BASE_COLOR = {
  r: "255",
  g: "245",
  b: "157",
  a: "1",
};
const BASE_RANGE = {
  equals: { active: false, value: null, color: { ...BASE_COLOR } },
  greaterThan: { active: false, value: null, color: { ...BASE_COLOR } },
  lessThan: { active: false, value: null, color: { ...BASE_COLOR } },
};
const allOption = t => ({
  name: "all",
  value: "all",
  label: t("Apply To All Columns", { ns: "range_highlight" }),
  dtype: "int",
});
const MODES = [
  ["Equals", "equals", (val, equals) => val === equals],
  ["Greater Than", "greaterThan", (val, greaterThan) => val > greaterThan],
  ["Less Than", "lessThan", (val, lessThan) => val < lessThan],
];

function retrieveRange(col, ranges) {
  const range = _.get(ranges, col?.value);
  if (range) {
    _.forEach(MODES, ([_label, key, _filter]) => {
      if (!_.isNil(range[key].value)) {
        range[key].value = range[key].value + "";
      }
    });
    return range;
  }
  return { ...BASE_RANGE };
}

const styles = color =>
  reactCSS({
    default: {
      color: {
        width: "30px",
        height: "14px",
        borderRadius: "2px",
        background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
      },
      swatch: {
        padding: "5px",
        background: "#fff",
        borderRadius: "1px",
        boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
        display: "inline-block",
        cursor: "pointer",
      },
      popover: {
        position: "absolute",
        zIndex: "2",
      },
      cover: {
        position: "fixed",
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    },
  });

export const rgbaStr = ({ r, g, b, a }) => `rgba(${r},${g},${b},${a})`;

function rangeAsStr(range) {
  const subRanges = [];
  _.forEach(MODES, ([label, key, _filter]) => {
    const { active, value, color } = range[key];
    if (active) {
      subRanges.push(<span key={subRanges.length}>{label} </span>);
      subRanges.push(
        <span key={subRanges.length} style={{ background: rgbaStr(color), padding: 3 }}>
          {value}
        </span>
      );
      subRanges.push(<span key={subRanges.length}> or </span>);
    }
  });
  subRanges.pop();
  return subRanges;
}

class ReactRangeHighlight extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ranges: _.get(props, "chartData.rangeHighlight", { ...BASE_RANGE }),
      col: allOption(props.t),
      editColor: null,
    };
    this.state.currRange = retrieveRange(allOption(props.t), this.state.ranges);
    this.updateHighlights = this.updateHighlights.bind(this);
    this.applyRange = this.applyRange.bind(this);
    this.removeRange = this.removeRange.bind(this);
    this.toggleRange = this.toggleRange.bind(this);
  }

  updateHighlights(key, rangeState) {
    const { currRange } = this.state;
    this.setState({ currRange: { ...currRange, [key]: { ...currRange[key], ...rangeState } } });
  }

  applyRange() {
    const { ranges, col, currRange } = this.state;
    const updatedRange = { ...currRange, active: true };
    let backgroundMode = {};
    _.forEach(MODES, ([_label, key, _filter]) => {
      const { active, value } = currRange[key];
      if (active && !_.isNil(value)) {
        updatedRange[key].value = parseFloat(value);
        backgroundMode = { backgroundMode: "range", triggerBgResize: true };
      }
    });
    const rangeHighlight = { ...ranges, [col.value]: updatedRange };
    if (_.get(this.props, "chartData.backgroundMode") === "range" && !_.has(backgroundMode, "backgroundMode")) {
      backgroundMode.backgroundMode = null;
    }
    this.setState(
      { ranges: rangeHighlight },
      serverState.saveRangeHighlights(this.props.dataId, rangeHighlight, () =>
        this.props.propagateState({ ...backgroundMode, rangeHighlight })
      )
    );
  }

  removeRange(col) {
    const { dataId, propagateState } = this.props;
    const ranges = { ...this.state.ranges };
    delete ranges[col];
    const props = {
      backgroundMode: _.size(ranges) ? "range" : null,
      triggerBgResize: true,
      rangeHighlight: ranges,
    };
    this.setState(
      { ranges },
      serverState.saveRangeHighlights(dataId, ranges, () => propagateState(props))
    );
  }

  toggleRange(col) {
    const { dataId, propagateState } = this.props;
    const ranges = { ...this.state.ranges };
    ranges[col].active = !ranges[col].active;
    const props = {
      backgroundMode: "range",
      triggerBgResize: true,
      rangeHighlight: ranges,
    };
    this.setState(
      { ranges },
      serverState.saveRangeHighlights(dataId, ranges, () => propagateState(props))
    );
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
        {_.map(MODES, ([label, key, _filter], i) => {
          const { currRange, editColor } = this.state;
          const { active, value, color } = currRange[key];
          const modeStyles = styles(color ?? BASE_COLOR);
          return (
            <div key={i} className="form-group row">
              <label className="col-md-4 col-form-label text-right">
                <i
                  className={`ico-check-box${active ? "" : "-outline-blank"} pointer mr-3 float-left`}
                  onClick={() => this.updateHighlights(key, { active: !active })}
                />
                {this.props.t(label, { ns: "column_filter" })}
              </label>
              <div className="col-md-6">
                <input
                  type="number"
                  disabled={!active}
                  className="form-control"
                  value={value || ""}
                  onChange={e => this.updateHighlights(key, { value: e.target.value })}
                />
              </div>
              <div className="col-md-1">
                <div
                  style={modeStyles.swatch}
                  onClick={() => this.setState({ editColor: editColor === key ? null : key })}>
                  <div style={modeStyles.color} />
                </div>
                {editColor === key ? (
                  <div style={modeStyles.popover}>
                    <div style={styles.cover} onClick={() => this.setState({ editColor: null })} />
                    <SketchPicker color={color} onChange={({ rgb }) => this.updateHighlights(key, { color: rgb })} />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
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
              {`: `}
              {rangeAsStr(range)}
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
  dataId: PropTypes.string,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    rangeHighlight: PropTypes.object,
    backgroundMode: PropTypes.string,
  }),
  propagateState: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactRangeHighlight = withTranslation(["column_filter", "range_highlight"])(ReactRangeHighlight);
const ReduxRangeHighlight = connect(state => _.pick(state, ["dataId", "chartData"]))(TranslateReactRangeHighlight);
export { TranslateReactRangeHighlight as ReactRangeHighlight, ReduxRangeHighlight as RangeHighlight, MODES };
