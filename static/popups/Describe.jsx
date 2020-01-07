import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { BouncerWrapper } from "../BouncerWrapper";
import { RemovableError } from "../RemovableError";
import chartUtils from "../chartUtils";
import { fetchJson } from "../fetcher";
import { DtypesGrid } from "./describe/DtypesGrid";

const DTYPES_URL = "/dtale/dtypes";
const BASE_DESCRIBE_URL = "/dtale/describe";

class ReactDescribe extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingDtypes: true,
      dtypes: null,
      dtypesFilter: null,
      loadingDetails: false,
      details: null,
    };
    this.loadDetails = this.loadDetails.bind(this);
    this.renderDetails = this.renderDetails.bind(this);
    this.renderUniques = this.renderUniques.bind(this);
    this.createBoxplot = this.createBoxplot.bind(this);
  }

  componentDidMount() {
    fetchJson(`${DTYPES_URL}/${this.props.dataId}`, dtypesData => {
      const newState = {
        error: null,
        detailError: null,
        loadingDtypes: false,
        loadingDetails: false,
        details: null,
      };
      if (dtypesData.error) {
        this.setState({ error: <RemovableError {...dtypesData} /> });
        return;
      }
      newState.dtypes = dtypesData.dtypes;
      let callback = _.noop;
      if (dtypesData.dtypes.length) {
        let selectedRow = _.find(dtypesData.dtypes, ({ name }) => name === this.props.chartData.col);
        if (_.isUndefined(selectedRow)) {
          selectedRow = _.head(dtypesData.dtypes);
        }
        callback = () => this.loadDetails({ rowData: selectedRow }); // by default, display first column
      }
      this.setState(newState, callback);
    });
  }

  loadDetails({ rowData }) {
    this.setState({ loadingDetails: true });
    fetchJson(`${BASE_DESCRIBE_URL}/${this.props.dataId}/${rowData.name}`, detailData => {
      const newState = {
        detailError: null,
        loadingDtypes: false,
        loadingDetails: false,
        details: null,
      };
      if (detailData.error) {
        newState.detailError = (
          <div className="col-md-12">
            <RemovableError {...detailData} />
          </div>
        );
        this.setState(newState);
        return;
      }
      newState.details = _.pick(detailData, ["describe", "uniques"]);
      newState.details.name = rowData.name;
      this.setState(newState, this.createBoxplot);
    });
  }

  renderUniques() {
    const uniques = _.get(this.state, "details.uniques") || {};
    if (_.isEmpty(uniques.data)) {
      return null;
    }
    return (
      <div key={3} className="row">
        <div className="col-sm-12">
          <span className="font-weight-bold" style={{ fontSize: "120%" }}>
            {`Unique Values${uniques.top ? " (top 100 most common)" : ""}:`}
          </span>
          <br />
          <span>{_.join(uniques.top ? uniques.data : _.sortBy(uniques.data), ", ")}</span>
        </div>
      </div>
    );
  }

  createBoxplot() {
    const builder = ctx => {
      const { details } = this.state;
      const { describe, name } = details || {};
      const chartData = _(describe || {})
        .pickBy((v, k) => _.includes(["25%", "50%", "75%", "min", "max"], k) && !_.includes(["nan", "inf"], v))
        .mapKeys((_v, k) => _.get({ "25%": "q1", "50%": "median", "75%": "q3" }, k, k))
        .mapValues(v => parseFloat(_.replace(v, /,/g, "")))
        .value();
      if (_.size(chartData) == 0) {
        return null;
      }
      _.forEach(["min", "max"], p => {
        if (!_.isUndefined(chartData[p])) {
          chartData[`whisker${p}`] = chartData[p];
        }
      });
      if (!_.isUndefined(describe.mean) && !_.includes(["nan", "inf"], describe.mean)) {
        chartData.outliers = [parseFloat(_.replace(describe.mean, /,/g, ""))];
      }
      return chartUtils.createChart(ctx, {
        type: "boxplot",
        data: {
          labels: [name],
          datasets: [
            {
              label: name,
              backgroundColor: "rgba(54, 162, 235, 0.5)",
              borderColor: "rgb(54, 162, 235)",
              borderWidth: 1,
              data: [chartData],
            },
          ],
        },
        options: {
          responsive: true,
          legend: { display: false },
          title: { display: false },
          tooltips: { enabled: false },
          scales: {
            yAxes: [{ ticks: { min: chartData.min - 1, max: chartData.max + 1 } }],
          },
        },
      });
    };
    const chart = chartUtils.chartWrapper("boxplot", this.state.boxplot, builder);
    this.setState({ boxplot: chart });
  }

  renderDetails() {
    if (this.state.detailError) {
      return (
        <div key={1} className="row">
          <div className="col-sm-12">{this.state.detailError}</div>
        </div>
      );
    }
    const { details } = this.state;
    if (_.isEmpty(details)) {
      return null;
    }

    return [
      <div key={1} className="row">
        <div className="col-sm-12">
          <h1>{details.name}</h1>
        </div>
      </div>,
      <div key={2} className="row">
        <div className="col-md-6">
          <ul>
            {_.map(_.get(details, "describe", {}), (v, k) => (
              <li key={k}>
                <div>
                  <h4 className="d-inline pr-5">{`${k}:`}</h4>
                  <span className="d-inline">{v}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-6">
          <div style={{ height: 300 }}>
            <canvas id="boxplot" />
          </div>
        </div>
      </div>,
      this.renderUniques(),
    ];
  }

  render() {
    if (this.state.error) {
      return (
        <div key="body" className="modal-body">
          {this.state.error}
        </div>
      );
    }
    return (
      <div key="body" className="modal-body">
        <div className="row">
          <div className="col-md-5">
            <BouncerWrapper showBouncer={this.state.loadingDtypes}>
              <DtypesGrid
                dtypes={this.state.dtypes}
                rowClick={this.loadDetails}
                selected={_.get(this.state, "details.name")}
              />
            </BouncerWrapper>
          </div>
          <div className="col-md-7">
            <BouncerWrapper showBouncer={this.state.loadingDetails}>{this.renderDetails()}</BouncerWrapper>
          </div>
        </div>
      </div>
    );
  }
}
ReactDescribe.displayName = "ReactDescribe";
ReactDescribe.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    col: PropTypes.string,
    query: PropTypes.string,
  }),
  height: PropTypes.number,
};
ReactDescribe.defaultProps = { height: 400 };

const ReduxDescribe = connect(state => _.pick(state, ["dataId", "chartData"]))(ReactDescribe);

export { ReactDescribe, ReduxDescribe as Describe };
