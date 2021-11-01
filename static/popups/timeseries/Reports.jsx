import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { buildURLString, dtypesUrl } from "../../actions/url-utils";
import chartUtils from "../../chartUtils";
import * as gu from "../../dtale/gridUtils";
import { fetchJson } from "../../fetcher";
import ChartsBody from "../charts/ChartsBody";
import * as BKFilter from "./BKFilter";
import { BaseInputs } from "./BaseInputs";
import * as CFFilter from "./CFFilter";
import * as HPFilter from "./HPFilter";
import * as SeasonalDecompose from "./SeasonalDecompose";

require("./Reports.css");

const reportTypes = pythonVersion => {
  const reports = ["hpfilter", "bkfilter", "cffilter", "seasonal_decompose"];
  if (!pythonVersion || pythonVersion[0] >= 3) {
    reports.push("stl");
  }
  return reports;
};

class ReactReports extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: "hpfilter",
      baseCfg: {},
      cfg: {},
      code: {},
      loadingColumns: true,
      loadingReports: false,
      multiChart: false,
    };
    this.run = this.run.bind(this);
    this.renderBody = this.renderBody.bind(this);
  }

  componentDidMount() {
    fetchJson(dtypesUrl(this.props.dataId), dtypesData => {
      const newState = { error: null, loadingColumns: false };
      if (dtypesData.error) {
        this.setState({ error: <RemovableError {...dtypesData} /> });
        return;
      }
      newState.columns = dtypesData.dtypes;
      const dateCols = _.filter(newState.columns || [], c => gu.findColType(c.dtype) === "date");
      if (dateCols.length === 1) {
        newState.baseCfg = { ...newState.baseCfg, index: dateCols[0].name };
      }
      this.setState(newState);
    });
  }

  run(state) {
    const { type } = this.state;
    let error = null,
      code = null;
    let cfg = state.cfg[type] ?? {};
    cfg = { ...cfg, ...(state.baseCfg ?? this.state.baseCfg) };
    switch (type) {
      case "seasonal_decompose":
      case "stl":
        error = SeasonalDecompose.validate(cfg);
        code = SeasonalDecompose.buildCode(type, cfg);
        break;
      case "bkfilter":
        error = BKFilter.validate(cfg);
        code = BKFilter.buildCode(cfg);
        break;
      case "cffilter":
        error = CFFilter.validate(cfg);
        code = CFFilter.buildCode(cfg);
        break;
      case "hpfilter":
      default:
        error = HPFilter.validate(cfg);
        code = HPFilter.buildCode(cfg);
        break;
    }
    if (!_.isNull(error)) {
      this.setState({
        ...state,
        url: null,
        code: null,
        error: <RemovableError error={error} />,
      });
      return;
    }
    const createParams = { type, cfg: JSON.stringify(cfg) };
    const url = buildURLString(`/dtale/timeseries-analysis/${this.props.dataId}?`, createParams);
    this.setState({
      ...state,
      url,
      code: { ...this.state.code, [type]: code },
      error: null,
    });
  }

  renderBody() {
    const { pythonVersion, t } = this.props;
    const { baseCfg, type } = this.state;
    const updateState = state => {
      if (_.has(state, "cfg")) {
        state.cfg = { ...this.state.cfg, [type]: state.cfg };
      }
      this.run(state);
    };
    const updateBaseCfg = baseCfg => {
      this.run({ ...this.state, baseCfg });
    };
    let body = null,
      configHandler = cfg => cfg,
      chartCols = [];
    const currCfg = this.state.cfg[type];
    const props = { updateState, cfg: currCfg, baseCfg };
    switch (type) {
      case "seasonal_decompose":
      case "stl":
        body = <SeasonalDecompose.SeasonalDecompose {...props} type={type} />;
        configHandler = SeasonalDecompose.chartConfig;
        chartCols = SeasonalDecompose.CHART_COLS;
        break;
      case "bkfilter":
        body = <BKFilter.BKFilter {...props} />;
        configHandler = BKFilter.chartConfig;
        chartCols = BKFilter.CHART_COLS;
        break;
      case "cffilter":
        body = <CFFilter.CFFilter {...props} />;
        configHandler = CFFilter.chartConfig;
        chartCols = CFFilter.CHART_COLS;
        break;
      case "hpfilter":
      default:
        body = <HPFilter.HPFilter {...props} />;
        configHandler = HPFilter.chartConfig;
        chartCols = HPFilter.CHART_COLS;
        break;
    }
    return (
      <>
        <div className="row ml-0 mr-0">
          <div className="col-auto pl-0">
            <h2>{t("Time Series Analysis", { ns: "menu" })}</h2>
          </div>
          <div className="col" />
          <div className="col-auto">
            <button className="btn btn-plain" onClick={this.props.hideSidePanel}>
              <i className="ico-close pointer" title={t("side:Close")} />
            </button>
          </div>
        </div>
        <div className="row ml-0 mr-0">
          <div className="btn-group compact col-auto pl-0">
            {_.map(reportTypes(pythonVersion), (chartType, i) => {
              const buttonProps = { className: "btn" };
              if (type === chartType) {
                buttonProps.className += " btn-primary active";
              } else {
                buttonProps.className += " btn-primary inactive";
                buttonProps.onClick = () => this.setState({ type: chartType, url: null, error: null });
              }
              return (
                <button key={i} {...buttonProps}>
                  <span className="d-block">{t(`timeseries:${chartType}`)}</span>
                </button>
              );
            })}
          </div>
          <div className="col">
            <div className="form-group row mb-0">
              <label className="col-auto col-form-label text-right pr-0">{t("Split Charts")}</label>
              <div className="col-auto mt-auto mb-auto pl-4">
                <i
                  className={`ico-check-box${this.state.multiChart ? "" : "-outline-blank"} pointer`}
                  onClick={() => this.setState({ multiChart: !this.state.multiChart })}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row ml-0 mr-0 pt-5 hpfilter-inputs">
          <BaseInputs columns={this.state.columns} updateState={updateBaseCfg} cfg={baseCfg} />
          {body}
        </div>
        {this.state.url && (
          <>
            <h3 className="mt-3 text-center">{t(`timeseries:${type}`)}</h3>
            <div className="pl-5 pr-5">
              <ChartsBody
                ref={this._chart}
                visible={this.state.url !== undefined}
                url={this.state.url}
                columns={[
                  { name: baseCfg.index, dtype: "datetime[ns]" },
                  _.find(this.state.columns, { name: baseCfg.col }),
                  ...chartCols.map(col => ({ name: col, dtype: "float64" })),
                ]}
                x={{ value: baseCfg.index }}
                y={[{ value: baseCfg.col }, ...chartCols.map(col => ({ value: col }))]}
                configHandler={config => {
                  if (this.state.multiChart) {
                    config.data.datasets = config.data.datasets.filter(dataset => dataset.data);
                    const field = config.data.datasets[0].label;
                    chartUtils.COLOR_PROPS.forEach(prop => (config.data.datasets[0][prop] = chartUtils.TS_COLORS[0]));
                    Object.keys(config.options.scales).forEach(scale => {
                      if (scale !== `y-${field}` && scale !== "x") {
                        delete config.options.scales[scale];
                      }
                    });
                    config.options.scales[`y-${field}`].position = "left";
                    config.options.plugins.legend = { display: false };
                    config.options.scales.x.title.display = false;
                    return config;
                  }
                  return configHandler(baseCfg, config);
                }}
                height={300}
                showControls={false}
                chartPerY={this.state.multiChart}
              />
            </div>
            <h4 className="mt-3">Code</h4>
            <pre>{_.join(_.get(this.state, ["code", type], []), "\n")}</pre>
          </>
        )}
      </>
    );
  }

  render() {
    let error = null;
    if (this.state.error) {
      error = (
        <div key="error" className="row" style={{ margin: "0 2em" }}>
          <div className="col-md-12">{this.state.error}</div>
        </div>
      );
    }
    return (
      <>
        {error}
        <BouncerWrapper showBouncer={this.state.loadingColumns}>{this.renderBody()}</BouncerWrapper>
      </>
    );
  }
}
ReactReports.displayName = "Reports";
ReactReports.propTypes = {
  dataId: PropTypes.string.isRequired,
  pythonVersion: PropTypes.arrayOf(PropTypes.number),
  hideSidePanel: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactReports = withTranslation(["timeseries", "menu", "side"])(ReactReports);
const ReduxReports = connect(
  ({ dataId, pythonVersion }) => ({ dataId, pythonVersion }),
  dispatch => ({ hideSidePanel: () => dispatch({ type: "hide-side-panel" }) })
)(TranslateReactReports);
export { TranslateReactReports as ReactReports, ReduxReports as Reports };
