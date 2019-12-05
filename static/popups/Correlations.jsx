import _ from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { Bouncer } from "../Bouncer";
import ConditionalRender from "../ConditionalRender";
import { RemovableError } from "../RemovableError";
import { closeChart } from "../actions/charts";
import { buildURL } from "../actions/url-utils";
import chartUtils from "../chartUtils";
import { fetchJson } from "../fetcher";
import { TimeseriesChartBody } from "./TimeseriesChartBody";
import CorrelationScatterStats from "./correlations/CorrelationScatterStats";
import CorrelationsGrid from "./correlations/CorrelationsGrid";
import corrUtils from "./correlations/correlationsUtils";

const BASE_SCATTER_URL = "/dtale/scatter?";
const BASE_CORRELATIONS_URL = "/dtale/correlations?";
const BASE_CORRELATIONS_TS_URL = "/dtale/correlations-ts?";

function buildState() {
  return {
    chart: null,
    error: null,
    scatterError: null,
    correlations: null,
    selectedCols: [],
    tsUrl: null,
    selectedDate: null,
  };
}

class ReactCorrelations extends React.Component {
  constructor(props) {
    super(props);
    this.state = buildState();
    _.forEach(
      ["buildTs", "buildScatter", "viewScatter", "viewScatterRow", "changeDate"],
      f => (this[f] = this[f].bind(this))
    );
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }
    const stateProps = ["error", "scatterError", "stats", "correlations", "selectedCols", "selectedDate"];
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
    fetchJson(buildURL(BASE_CORRELATIONS_URL, this.props.chartData, ["query"]), gridData => {
      if (gridData.error) {
        this.setState({ error: <RemovableError {...gridData} /> });
        return;
      }
      const { data, dates } = gridData;
      this.setState({
        correlations: data,
        dates,
        hasDate: _.size(dates) > 0,
        selectedDate: _.get(dates, 0, null),
      });
    });
  }

  changeDate(evt) {
    this.buildTs(this.state.selectedCols, evt.target.value);
  }

  buildTs(selectedCols, selectedDate) {
    const query = _.get(this.props, "chartData.query");
    const tsUrl = buildURL(BASE_CORRELATIONS_TS_URL, { query, selectedCols, dateCol: selectedDate }, [
      "query",
      "selectedCols",
      "dateCol",
    ]);
    this.setState({ selectedCols, selectedDate, tsUrl });
  }

  viewScatterRow(evt) {
    const point = this.state.chart.getElementAtEvent(evt);
    if (point) {
      const data = point[0]._chart.config.data.datasets[point[0]._datasetIndex].data;
      const index = data[point[0]._index].index;
      this.props.onClose();
      let updatedQuery = this.props.chartData.query;
      if (updatedQuery) {
        updatedQuery = [updatedQuery, `index == ${index}`];
      } else {
        updatedQuery = [`index == ${index}`];
      }
      this.props.propagateState({ query: _.join(updatedQuery, " and ") });
    }
  }

  buildScatter(selectedCols, date = null) {
    corrUtils.toggleBouncer();
    const params = { selectedCols, query: this.props.chartData.query };
    if (date) {
      params.dateCol = this.state.selectedDate;
      params.date = date;
    }
    fetchJson(buildURL(BASE_SCATTER_URL, params, ["selectedCols", "query", "date", "dateCol"]), fetchedChartData => {
      corrUtils.toggleBouncer();
      const newState = {
        selectedCols,
        stats: fetchedChartData.stats,
        date,
        scatterError: null,
      };
      if (fetchedChartData.error) {
        newState.scatterError = <RemovableError {...fetchedChartData} />;
      }
      const builder = ctx => {
        if (!_.get(fetchedChartData, "data", []).length) {
          return null;
        }
        const { data, x, y } = fetchedChartData;
        return corrUtils.createScatter(ctx, data, x, y, this.props.chartData.title, this.viewScatterRow);
      };
      newState.chart = chartUtils.chartWrapper("rawScatterChart", this.state.chart, builder);
      this.setState(newState);
    });
  }

  viewScatter(evt) {
    const chart = _.get(this, "_ts_chart.state.chart.ts-chart");
    if (chart) {
      const selectedPoint = _.head(chart.getElementsAtXAxis(evt));
      if (selectedPoint) {
        const date = moment(new Date(chart.data.datasets[0].data[selectedPoint._index].x)).format("YYYYMMDD");
        const { selectedCols } = this.state;
        this.buildScatter(selectedCols, date);
      }
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div key="body" className="modal-body scatter-body">
          {this.state.error}
        </div>
      );
    }
    const { selectedCols, tsUrl, selectedDate, hasDate, dates } = this.state;
    return (
      <div key="body" className="modal-body scatter-body">
        <CorrelationsGrid buildTs={this.buildTs} buildScatter={this.buildScatter} {...this.state} />
        <ConditionalRender display={!_.isEmpty(selectedCols) && hasDate}>
          <div className="row d-inline">
            <div className="float-left pt-5">
              <b>{`Timeseries of Pearson Correlation for ${selectedCols[0]} vs. ${selectedCols[1]}`}</b>
              <small className="pl-3">
                (Click on any point in the chart to view the scatter plot of that correlation)
              </small>
            </div>
            <ConditionalRender display={_.size(dates) > 1}>
              <div className="form-group row small-gutters float-right pt-5 pr-3">
                <label className="col-form-label text-right">Date Column</label>
                <div>
                  <select className="form-control custom-select" defaultValue={selectedDate} onChange={this.changeDate}>
                    {_.map(dates, d => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </ConditionalRender>
          </div>
          <TimeseriesChartBody
            ref={r => (this._ts_chart = r)}
            url={tsUrl}
            visible={true}
            configHandler={config => {
              config.options.scales.yAxes = [
                {
                  ticks: { min: -1.1, max: 1.1, stepSize: 0.2 },
                  afterTickToLabelConversion: data => {
                    data.ticks[0] = null;
                    data.ticks[data.ticks.length - 1] = null;
                  },
                },
              ];
              config.options.onClick = this.viewScatter;
              config.options.legend = { display: false };
              config.plugins = [chartUtils.gradientLinePlugin(corrUtils.colorScale, -1, 1)];
              return config;
            }}
            height={300}
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
      </div>
    );
  }
}
ReactCorrelations.displayName = "Correlations";
ReactCorrelations.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    query: PropTypes.string,
    title: PropTypes.string,
  }),
  onClose: PropTypes.func,
  propagateState: PropTypes.func,
};

const ReduxCorrelations = connect(
  state => ({ chartData: state.chartData }),
  dispatch => ({ onClose: () => dispatch(closeChart()) })
)(ReactCorrelations);

export { ReactCorrelations, ReduxCorrelations as Correlations };
