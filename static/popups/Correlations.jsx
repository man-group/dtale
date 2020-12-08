import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { Bouncer } from "../Bouncer";
import { BouncerWrapper } from "../BouncerWrapper";
import ConditionalRender from "../ConditionalRender";
import { RemovableError } from "../RemovableError";
import { buildURL } from "../actions/url-utils";
import chartUtils from "../chartUtils";
import { fetchJson } from "../fetcher";
import { saveFilter } from "../popups/Filter";
import { toggleBouncer } from "../toggleUtils";
import ChartsBody from "./charts/ChartsBody";
import CorrelationScatterStats from "./correlations/CorrelationScatterStats";
import CorrelationsGrid from "./correlations/CorrelationsGrid";
import CorrelationsTsOptions from "./correlations/CorrelationsTsOptions";
import PPSCollapsible from "./correlations/PPSCollapsible";
import corrUtils from "./correlations/correlationsUtils";

class Correlations extends React.Component {
  constructor(props) {
    super(props);
    this.state = corrUtils.buildState();
    _.forEach(["buildTs", "buildScatter", "viewScatter", "viewScatterRow"], f => (this[f] = this[f].bind(this)));
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }
    const stateProps = _.concat(
      ["error", "scatterError", "stats", "correlations", "selectedCols", "selectedDate", "window", "minPeriods"],
      ["useRolling"]
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

  componentDidMount() {
    fetchJson(
      buildURL(`${corrUtils.BASE_CORRELATIONS_URL}/${this.props.dataId}`, this.props.chartData, ["query"]),
      gridData => {
        if (gridData.error) {
          this.setState({
            error: <RemovableError {...gridData} />,
            loadingCorrelations: false,
          });
          return;
        }
        const { data, dates, code } = gridData;
        const columns = _.map(data, "column");
        const rolling = _.get(dates, "0.rolling", false);
        const state = {
          correlations: data,
          columns,
          dates,
          hasDate: _.size(dates) > 0,
          selectedDate: _.get(dates, "0.name", null),
          rolling,
          gridCode: code,
          loadingCorrelations: false,
        };
        this.setState(state, () => {
          const { col1, col2 } = corrUtils.findCols(this.props.chartData, columns);
          if (col1 && col2) {
            if (state.hasDate) {
              if (rolling) {
                this.buildTs([col1, col2], state.selectedDate, true, true);
              } else {
                this.buildTs([col1, col2], state.selectedDate, false, this.state.useRolling);
              }
            } else {
              this.buildScatter([col1, col2]);
            }
          }
        });
      }
    );
  }

  buildTs(selectedCols, selectedDate, rolling, useRolling, window = null, minPeriods = null) {
    const query = _.get(this.props, "chartData.query");
    const path = `${corrUtils.BASE_CORRELATIONS_TS_URL}/${this.props.dataId}`;
    let urlParams = {
      query,
      selectedCols,
      dateCol: selectedDate,
      rolling,
    };
    if (useRolling) {
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
    };
    if (useRolling && !_.isNull(window)) {
      updatedState.window = window;
    }
    if (useRolling && !_.isNull(minPeriods)) {
      updatedState.minPeriods = minPeriods;
    }
    this.setState(updatedState);
  }

  viewScatterRow(evt) {
    const point = this.state.chart.getElementAtEvent(evt);
    if (point && point[0]._datasetIndex !== undefined) {
      const data = _.get(point, ["0", "_chart", "config", "data", "datasets", point[0]._datasetIndex, "data"]);
      if (data) {
        const index = data[point[0]._index].index;
        let updatedQuery = this.props.chartData.query;
        if (updatedQuery) {
          updatedQuery = [updatedQuery, `index == ${index}`];
        } else {
          updatedQuery = [`index == ${index}`];
        }
        saveFilter(this.props.dataId, _.join(updatedQuery, " and "), window.opener.location.reload);
      }
    }
  }

  buildScatter(selectedCols, date = null, tsCode = null) {
    const scatterUrl = corrUtils.buildScatterParams(selectedCols, date, this.props, this.state);
    if (this.state.scatterUrl === scatterUrl) {
      return;
    }
    toggleBouncer(["scatter-bouncer", "rawScatterChart"]);
    fetchJson(scatterUrl, fetchedChartData => {
      toggleBouncer(["scatter-bouncer", "rawScatterChart"]);
      const newState = {
        selectedCols,
        stats: fetchedChartData.stats,
        date,
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
    const chart = _.get(this, "_ts_chart.state.charts.0");
    if (chart) {
      const selectedPoint = _.head(chart.getElementsAtXAxis(evt));
      if (selectedPoint) {
        chart.getDatasetMeta(0).controller._config.selectedPoint = selectedPoint._index;
        const { selectedCols } = this.state;
        this.buildScatter(selectedCols, chart.data.labels[selectedPoint._index]);
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
            />
            <ConditionalRender display={!_.isEmpty(selectedCols) && hasDate}>
              <PPSCollapsible ppsInfo={this.state.tsPps} />
              <CorrelationsTsOptions {...this.state} buildTs={this.buildTs} />
              <ChartsBody
                ref={r => (this._ts_chart = r)}
                visible={true}
                url={tsUrl}
                columns={[
                  { name: "x", dtype: "datetime[ns]" },
                  { name: "corr", dtype: "float64" },
                ]}
                x={{ value: "x" }}
                y={[{ value: "corr" }]}
                configHandler={config => {
                  config.options.scales.yAxes = [
                    {
                      ticks: { min: -1.1, max: 1.1, stepSize: 0.2 },
                      afterTickToLabelConversion: data => {
                        data.ticks[0] = null;
                        data.ticks[data.ticks.length - 1] = null;
                      },
                      id: "y-corr",
                    },
                  ];
                  config.options.scales.xAxes[0].scaleLabel.display = false;
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
                    this.buildScatter(this.state.selectedCols, selectedDate, tsCode);
                  } else {
                    this.setState({
                      tsCode: _.get(data, "code", ""),
                      tsPps: _.get(data, "pps"),
                    });
                  }
                }}
              />
            </ConditionalRender>
            <CorrelationScatterStats {...this.state} />
            <figure>
              {this.state.scatterError}
              <ConditionalRender display={_.isEmpty(this.state.scatterError)}>
                <div className="chart-wrapper" style={{ height: 400 }}>
                  <div id="scatter-bouncer" style={{ display: "none" }}>
                    <Bouncer />
                  </div>
                  <canvas id="rawScatterChart" />
                </div>
              </ConditionalRender>
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

export { Correlations };
