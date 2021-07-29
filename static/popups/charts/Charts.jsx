import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import Select, { createFilter } from "react-select";

import { RemovableError } from "../../RemovableError";
import { buildURLString } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import Aggregations from "./Aggregations";
import ChartsBody from "./ChartsBody";

function generateChartState(state, { dataId, t }) {
  const { group, x, y, query, aggregation, rollingWindow, rollingComputation } = state;
  if (_.isNull(x) || _.isNull(y)) {
    return { url: null };
  }
  const params = { x: x.value, y: JSON.stringify(_.map(y, "value")), query };
  if (!_.isNull(group)) {
    params.group = JSON.stringify(_.map(group, "value"));
  }
  if (!_.isNull(aggregation)) {
    params.agg = aggregation;
    if (aggregation === "rolling") {
      if (rollingWindow && parseInt(rollingWindow)) {
        params.rollingWin = parseInt(rollingWindow);
      } else {
        return {
          url: null,
          error: t("Aggregation (rolling) requires a window"),
        };
      }
      if (rollingComputation) {
        params.rollingComp = rollingComputation;
      } else {
        return {
          url: null,
          error: t("Aggregation (rolling) requires a computation"),
        };
      }
    }
  }
  return { url: buildURLString(`/dtale/chart-data/${dataId}`, params) };
}

const baseState = ({ query, x, y, group, aggregation }) => ({
  x: x ? { value: x } : null,
  y: y ? _.map(y, y2 => ({ value: y2 })) : null,
  group: group ? _.map(group, g => ({ value: g })) : null,
  aggregation,
  rollingComputation: null,
  rollingWindow: "4",
  url: null,
  query,
  error: null,
});

require("./Charts.css");

class ReactCharts extends React.Component {
  constructor(props) {
    super(props);
    this.state = baseState(_.get(props, "chartData") || {});
    this.renderSelect = this.renderSelect.bind(this);
  }

  componentDidMount() {
    fetchJson(`/dtale/dtypes/${this.props.dataId}`, data => {
      if (data.error) {
        this.setState({ error: <RemovableError {...data} /> });
        return;
      }
      const { dtypes } = data;
      this.setState({ columns: dtypes }, () => this.setState(generateChartState(this.state, this.props)));
    });
  }

  renderSelect(label, prop, otherProps, isMulti = false) {
    const { columns } = this.state;
    let finalOptions = _.map(columns, "name");
    let otherValues = _.pick(this.state, otherProps);
    otherValues = _.map(_.flatten(_.values(otherValues)), "value");
    otherValues = _.compact(otherValues);
    finalOptions = _.difference(finalOptions, otherValues);
    return (
      <div className="input-group mr-3">
        <span className="input-group-addon">{this.props.t(label)}</span>
        <Select
          isMulti={isMulti}
          className="Select is-clearable is-searchable Select--single"
          classNamePrefix="Select"
          options={_.map(
            _.sortBy(finalOptions, o => _.toLower(o)),
            o => ({ value: o })
          )}
          getOptionLabel={_.property("value")}
          getOptionValue={_.property("value")}
          value={this.state[prop]}
          onChange={selected => this.setState({ [prop]: selected })}
          isClearable
          filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
        />
      </div>
    );
  }

  render() {
    const { t } = this.props;
    const { columns, query, error } = this.state;
    if (_.isEmpty(columns)) {
      return error;
    }
    return (
      <div className="charts-body">
        <div className="row pt-3 pb-3 charts-filters">
          <div className="col">
            <div className="input-group">
              <span className="input-group-addon">{t("Query")}</span>
              <input
                className="form-control input-sm"
                type="text"
                value={query || ""}
                onChange={e => this.setState({ query: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="row pt-3 pb-3 charts-filters">
          <div className="col-auto">{this.renderSelect("X", "x", ["y", "group"])}</div>
          <div className="col">{this.renderSelect("Y", "y", ["x", "group"], true)}</div>
          <div className="col">{this.renderSelect("Group", "group", ["x", "y"], true)}</div>
        </div>
        <div className="row pt-3 pb-3 charts-filters">
          <Aggregations propagateState={state => this.setState(state)} {...this.state} />
          <div className="col-auto">
            <button
              className="btn btn-primary float-right"
              onClick={() => this.setState(generateChartState(this.state, this.props))}>
              <span>{t("Load")}</span>
            </button>
          </div>
        </div>
        <ChartsBody
          ref={r => (this._chart = r)}
          chartType={_.get(this.props, "chartData.chartType")}
          chartPerGroup={_.get(this.props, "chartData.chartPerGroup")}
          visible={_.get(this.props, "chartData.visible", false)}
          {...this.state}
          height={450}
        />
      </div>
    );
  }
}
ReactCharts.displayName = "Charts";
ReactCharts.propTypes = {
  dataId: PropTypes.string,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    query: PropTypes.string,
    x: PropTypes.string,
    y: PropTypes.string,
    group: PropTypes.arrayOf(PropTypes.string),
    aggregation: PropTypes.string,
    chartType: PropTypes.string,
    chartPerGroup: PropTypes.bool,
  }),
  t: PropTypes.func,
};
const TranslateReactCharts = withTranslation("charts")(ReactCharts);
const ReduxCharts = connect(({ dataId, chartData }) => ({ dataId, chartData }))(TranslateReactCharts);

export { TranslateReactCharts as ReactCharts, ReduxCharts as Charts };
