import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { Bouncer } from "../Bouncer";
import { BouncerWrapper } from "../BouncerWrapper";
import { RemovableError } from "../RemovableError";
import * as actions from "../actions/dtale";
import { buildURL } from "../actions/url-utils";
import chartUtils from "../chartUtils";
import { fetchJson } from "../fetcher";
import { saveFilter } from "../popups/filter/filterUtils";
import { toggleBouncer } from "../toggleUtils";
import ChartsBody from "./charts/ChartsBody";
import CorrelationScatterStats from "./correlations/CorrelationScatterStats";
import CorrelationsGrid from "./correlations/CorrelationsGrid";
import CorrelationsTsOptions from "./correlations/CorrelationsTsOptions";
import PPSCollapsible from "./correlations/PPSCollapsible";
import corrUtils from "./correlations/correlationsUtils";

export default class Correlations extends React.Component {
  constructor(props) {
    super(props);
    this.state = corrUtils.buildState();
    _.forEach(
      ["buildTs", "buildScatter", "viewScatter", "viewScatterRow", "loadGrid"],
      f => (this[f] = this[f].bind(this))
    );
    this._ts_chart = React.createRef();
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }
    const stateProps = _.concat(
      ["error", "scatterError", "stats", "correlations", "selectedCols", "selectedDate", "window", "minPeriods"],
      ["useRolling", "encodeStrings", "loadingCorrelations"]
    );
    if (!_.isEqual(_.pick(this.state, stateProps), _.pick(newState, stateProps))) {
      return true;
    }
    if (this.state.chart != newState.chart) {
      // Don't re-render if we've only changed the chart.
      return false;
    }
    return false; // Otherwise, use the default react behaviour.
  }

  loadGrid() {
    this.setState({ loadingCorrelations: true });
    const url = buildURL(
      `${corrUtils.BASE_CORRELATIONS_URL}/${this.props.dataId}`,
      { ...this.props.chartData, encodeStrings: this.state.encodeStrings },
      ["query", "encodeStrings"]
    );
    fetchJson(url, gridData => {
      if (gridData.error) {
        this.setState({
          error: <RemovableError {...gridData} />,
          loadingCorrelations: false,
        });
        return;
      }
      const state = corrUtils.buildGridLoadState(gridData);
      this.setState(state, () => {
        const { col1, col2 } = corrUtils.findCols(this.props.chartData, state.columns);
        if (col1 && col2) {
          if (state.hasDate) {
            if (state.rolling) {
              this.buildTs([col1, col2], state.selectedDate, true, true);
            } else {
              this.buildTs([col1, col2], state.selectedDate, false, this.state.useRolling);
            }
          } else {
            this.buildScatter([col1, col2]);
          }
        }
      });
    });
  }

  componentDidMount() {
    this.loadGrid();
  }

  componentDidUpdate(_prevProps, prevState) {
    if (this.state.encodeStrings !== prevState.encodeStrings) {
      this.loadGrid();
    }
  }

  buildTs(selectedCols, selectedDate, rolling, useRolling, window = null, minPeriods = null) {
    const query = _.get(this.props, "chartData.query");
    const path = `${corrUtils.BASE_CORRELATIONS_TS_URL}/${this.props.dataId}`;
    let urlParams = {
      query,
      selectedCols,
      dummyCols: corrUtils.findDummyCols(selectedCols, this.state.dummyColMappings),
      dateCol: selectedDate,
      rolling: rolling || useRolling,
    };
    if (urlParams.rolling) {
      urlParams = {
        ...urlParams,
        rollingWindow: window ?? this.state.window,
        minPeriods: minPeriods ?? this.state.minPeriods,
      };
    }
    const tsUrl = buildURL(path, urlParams, [
      "query",
      "selectedCols",
      "dateCol",
      "rolling",
      "rollingWindow",
      "minPeriods",
    ]);
    const updatedState = {
      selectedCols,
      selectedDate,
      tsUrl,
      rolling,
      useRolling,
      error: null,
    };
    if (urlParams.rolling && !_.isNull(window)) {
      updatedState.window = window;
    }
    if (urlParams.rolling && !_.isNull(minPeriods)) {
      updatedState.minPeriods = minPeriods;
    }
    this.setState(updatedState);
  }

  viewScatterRow(evt) {
    const point = this.state.chart.getElementsAtEventForMode(evt, "nearest", { intersect: true }, false);
    if (point && point[0].datasetIndex !== undefined) {
      const data = _.get(this.state, ["chart", "config", "_config", "data", "datasets", point[0].datasetIndex, "data"]);
      if (data) {
        const index = data[point[0].index]._corr_index;
        let updatedQuery = this.props.chartData.query;
        if (updatedQuery) {
          updatedQuery = [updatedQuery, `index == ${index}`];
        } else {
          updatedQuery = [`index == ${index}`];
        }
        saveFilter(this.props.dataId, _.join(updatedQuery, " and "), () => {
          if (actions.isPopup()) {
            window.opener.location.reload();
            return;
          }
          window.location.reload();
        });
      }
    }
  }

  buildScatter(selectedCols, dateIndex = null, tsCode = null) {
    const scatterUrl = corrUtils.buildScatterParams(selectedCols, dateIndex, this.props, this.state);
    if (this.state.scatterUrl === scatterUrl) {
      return;
    }
    toggleBouncer(["scatter-bouncer", "rawScatterChart"]);
    fetchJson(scatterUrl, fetchedChartData => {
      toggleBouncer(["scatter-bouncer", "rawScatterChart"]);
      const newState = {
        selectedCols,
        stats: fetchedChartData.stats,
        date: fetchedChartData.date,
        scatterError: null,
        scatterUrl,
        scatterCode: fetchedChartData.code,
      };
      if (tsCode) {
        newState.tsCode = tsCode;
      }
      if (fetchedChartData.error) {
        newState.scatterError = <RemovableError {...fetchedChartData} />;
        this.setState(newState);
        return;
      }
      const builder = ctx => {
        if (!_.get(fetchedChartData, "data.all.x", []).length) {
          return null;
        }
        const { x, y } = fetchedChartData;
        return corrUtils.createScatter(ctx, fetchedChartData, x, y, this.viewScatterRow);
      };
      newState.chart = chartUtils.chartWrapper("rawScatterChart", this.state.chart, builder);
      this.setState(newState);
    });
  }

  viewScatter(evt) {
    const chart = _.get(this, "_ts_chart.current.state.charts.0");
    if (chart) {
      const selectedPoints = chart.getElementsAtEventForMode(evt, "index", { intersect: false }, false);
      const selectedPoint = _.head(selectedPoints);
      if (selectedPoint) {
        chart.config._config.data.datasets[selectedPoint.datasetIndex].selectedPoint = selectedPoint.index;
        const { selectedCols } = this.state;
        this.buildScatter(selectedCols, selectedPoint.index);
      }
    }
  }

  render() {
    const { selectedCols, tsUrl, hasDate, error } = this.state;
    return (
      <div key="body" className="modal-body scatter-body">
        {error}
        {!error && (
          <BouncerWrapper showBouncer={this.state.loadingCorrelations}>
            <CorrelationsGrid
              buildTs={this.buildTs}
              buildScatter={this.buildScatter}
              selectedCols={selectedCols}
              {...this.state}
              toggleStrings={() => this.setState({ encodeStrings: !this.state.encodeStrings })}
            />
            {!_.isEmpty(selectedCols) && hasDate && (
              <>
                <PPSCollapsible ppsInfo={this.state.tsPps} />
                <CorrelationsTsOptions {...this.state} buildTs={this.buildTs} />
                <ChartsBody
                  ref={this._ts_chart}
                  visible={true}
                  url={tsUrl}
                  columns={[
                    { name: "x", dtype: "datetime[ns]" },
                    { name: "corr", dtype: "float64" },
                  ]}
                  x={{ value: "x" }}
                  y={[{ value: "corr" }]}
                  configHandler={config => {
                    config.options.scales["y-corr"] = {
                      ticks: { min: -1.1, max: 1.1, stepSize: 0.2 },
                      afterTickToLabelConversion: data => {
                        data.ticks[0] = { label: null };
                        data.ticks[data.ticks.length - 1] = { label: null };
                      },
                    };
                    config.options.scales.x.scaleLabel.display = false;
                    config.options.onClick = this.viewScatter;
                    config.options.legend = { display: false };
                    config.plugins = [
                      chartUtils.gradientLinePlugin(corrUtils.colorScale, "y-corr", -1, 1),
                      chartUtils.lineHoverPlugin(corrUtils.colorScale),
                    ];
                    config.data.datasets[0].selectedPoint = 0;
                    return config;
                  }}
                  height={300}
                  showControls={false}
                  dataLoadCallback={data => {
                    const selectedDate = _.get(data || {}, "data.all.x.0");
                    const tsCode = _.get(data, "code", "");
                    if (selectedDate) {
                      this.setState({ tsPps: _.get(data, "pps") });
                      this.buildScatter(this.state.selectedCols, 0, tsCode);
                    } else {
                      this.setState({
                        tsCode: _.get(data, "code", ""),
                        tsPps: _.get(data, "pps"),
                      });
                    }
                  }}
                />
              </>
            )}
            <CorrelationScatterStats {...this.state} />
            <figure>
              {this.state.scatterError}
              {_.isEmpty(this.state.scatterError) && (
                <div className="chart-wrapper" style={{ height: 400 }}>
                  <div id="scatter-bouncer" style={{ display: "none" }}>
                    <Bouncer />
                  </div>
                  <canvas id="rawScatterChart" />
                </div>
              )}
            </figure>
          </BouncerWrapper>
        )}
      </div>
    );
  }
}
Correlations.displayName = "Correlations";
Correlations.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    query: PropTypes.string,
    title: PropTypes.string,
    col1: PropTypes.string,
    col2: PropTypes.string,
  }),
  propagateState: PropTypes.func,
};
