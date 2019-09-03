import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import ConditionalRender from "../ConditionalRender";
import { JSAnchor } from "../JSAnchor";
import { closeChart } from "../actions/charts";
import { buildURLString } from "../actions/url-utils";
import { isDateCol } from "../dtale/gridUtils";
import CoverageChartBody from "./CoverageChartBody";

const DATE_FREQS = ["D", "W", "M", "Q", "Y"];
const FREQ_LABELS = { D: "Daily", W: "Weekly", M: "Monthly", Q: "Quarterly", Y: "Yearly" };

function buildURL({ group, col, query }) {
  const params = { group: JSON.stringify(group), col: _.join(_.map(col, "name"), ","), query };
  return buildURLString("/dtale/coverage", params);
}

function generateChartState({ group, col, query }) {
  if (_.isEmpty(group) || _.isEmpty(col)) {
    return { url: null, desc: null };
  }
  const groups = _.join(
    _.map(group, ({ name, freq }) => {
      if (freq) {
        return `${name}(${FREQ_LABELS[freq]})`;
      }
      return name;
    }),
    ", "
  );
  const desc = { groups, cols: _.join(_.map(col, "name"), ", ") };
  return { url: buildURL({ group, col, query }), desc };
}

const baseState = query => ({ col: [], group: [], url: null, desc: null, zoomed: null, query });

require("./CoverageChart.css");

class ReactCoverageChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = baseState(_.get(props, "chartData.query"));
    this.changeSelection = this.changeSelection.bind(this);
    this.viewTimeDetails = this.viewTimeDetails.bind(this);
    this.resetZoom = this.resetZoom.bind(this);
    this.renderLabel = this.renderLabel.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }

    const stateProps = ["group", "col", "url", "zoomed"];
    if (!_.isEqual(_.pick(this.state, stateProps), _.pick(newState, stateProps))) {
      return true;
    }

    return false; // Otherwise, use the default react behaviour.
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props.chartData, prevProps.chartData)) {
      this.setState(baseState(_.get(this.props, "chartData.query")));
    }
  }

  changeSelection(e, prop, value, multi = true) {
    const currSelections = this.state[prop];
    const { name } = value;
    if (multi && e.shiftKey) {
      if (_.find(currSelections, { name })) {
        this.setState({ [prop]: _.reject(currSelections, { name }) });
      } else {
        this.setState({ [prop]: _.concat([value], currSelections) });
      }
    } else {
      this.setState({ [prop]: [value] });
    }
  }

  resetZoom() {
    const chart = _.get(this, "_chart.state.chart");
    if (chart) {
      delete chart.options.scales.xAxes[0].ticks;
      chart.update();
      this.setState({ zoomed: false });
    }
  }

  viewTimeDetails(evt) {
    const chart = _.get(this, "_chart.state.chart");
    if (chart) {
      const selectedPoint = _.head(chart.getElementAtEvent(evt));
      if (selectedPoint) {
        const ticks = {
          min: chart.data.labels[_.max([0, selectedPoint._index - 10])],
          max: chart.data.labels[_.min([chart.data.labels.length - 1, selectedPoint._index + 10])],
        };
        chart.options.scales.xAxes[0].ticks = ticks;
        chart.update();
        this.setState({ zoomed: `${ticks.min} - ${ticks.max}` });
      }
    }
  }

  renderLabel() {
    const { desc, zoomed } = this.state;
    if (!desc) {
      return null;
    }
    const { cols, groups } = desc;
    return (
      <div className="coverage-desc">
        <span>Count of non-nan values for </span>
        <b>{cols}</b>
        <span> grouped by </span>
        <b>{groups}</b>
        <ConditionalRender display={!_.isEmpty(zoomed)}>
          <br />
          <span className="pr-3" style={{ marginLeft: "3em" }}>{`Zoomed: ${zoomed}`}</span>
          <JSAnchor onClick={this.resetZoom}>{"X"}</JSAnchor>
        </ConditionalRender>
      </div>
    );
  }

  render() {
    const { chartData } = this.props;
    const { visible, cols } = chartData;
    const { group, col } = this.state;
    return (
      <div className="row coverage-popup p-3">
        <div className="col-md-2">
          <label className="list-group-item">Group(s)</label>
          <div className="scrollable-list">
            <ul className="list-group">
              {_.map(_.filter(cols, ({ name }) => !_.find(col, { name })), ({ dtype, name }, idx) => {
                const currSelection = _.find(group, { name }) || { name };
                const isSelected = _.find(group, { name });
                const isDate = isDateCol(dtype);
                if (isDate) {
                  currSelection.freq = currSelection.freq || "D";
                }
                const props = {
                  className: `list-group-item list-group-item-action ${isSelected ? "active" : ""}`,
                  key: idx,
                  onClick: e => this.changeSelection(e, "group", currSelection),
                };

                if (isDate) {
                  const updateFreq = e => {
                    this.setState({
                      group: _.concat(_.reject(this.state.group, { name }), [{ name, freq: e.target.value }]),
                    });
                    e.stopPropagation();
                  };
                  props.className += " date-group";
                  return (
                    <JSAnchor {...props}>
                      <div>{name}</div>
                      <div className="input-group">
                        <select
                          value={currSelection.freq || ""}
                          className="form-control custom-select"
                          disabled={!isSelected}
                          onChange={updateFreq}
                          onClick={e => e.stopPropagation()}>
                          {_.map(DATE_FREQS, f => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                    </JSAnchor>
                  );
                }
                return <JSAnchor {...props}>{name}</JSAnchor>;
              })}
            </ul>
          </div>
        </div>
        <div className="col-md-2">
          <label className="list-group-item">Col(s)</label>
          <div className="scrollable-list">
            <ul className="list-group">
              {_.map(_.filter(cols, ({ name }) => !_.find(group, { name })), ({ name }, idx) => {
                const props = {
                  className: `list-group-item list-group-item-action ${_.find(col, { name }) ? "active" : ""}`,
                  key: idx,
                  onClick: e => this.changeSelection(e, "col", { name }, false),
                };
                return <JSAnchor {...props}>{name}</JSAnchor>;
              })}
            </ul>
          </div>
        </div>
        <div className="col-md-8">
          <div className="row">
            <div className="col-md-10">{this.renderLabel()}</div>
            <div className="col-md-2">
              <button className="btn btn-primary" onClick={() => this.setState(generateChartState(this.state))}>
                <span>Load</span>
              </button>
            </div>
          </div>
          <CoverageChartBody
            ref={r => (this._chart = r)}
            visible={visible}
            url={this.state.url}
            col={_.map(col, "name")}
            group={_.map(group, "name")}
            additionalOptions={{
              onClick: this.viewTimeDetails,
            }}
            height={450}
          />
        </div>
      </div>
    );
  }
}
ReactCoverageChart.displayName = "CoverageChart";
ReactCoverageChart.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    cols: PropTypes.arrayOf(PropTypes.object),
    query: PropTypes.string,
  }),
};

function mapDispatchToProps(dispatch) {
  return { onClose: () => dispatch(closeChart()) };
}

const ReduxCoverageChart = connect(
  ({ chartData }) => ({ chartData }),
  mapDispatchToProps
)(ReactCoverageChart);

export { ReactCoverageChart, ReduxCoverageChart as CoverageChart };
