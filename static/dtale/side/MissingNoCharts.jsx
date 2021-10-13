import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { BouncerWrapper } from "../../BouncerWrapper";
import ButtonToggle from "../../ButtonToggle";
import { RemovableError } from "../../RemovableError";
import { buildURLString, dtypesUrl } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import FilterSelect from "../../popups/analysis/filters/FilterSelect";
import ColumnSelect from "../../popups/create/ColumnSelect";
import * as gu from "../gridUtils";
import menuFuncs from "../menu/dataViewerMenuUtils";

require("./MissingNoCharts.css");

const chartOpts = t =>
  _.map(["matrix", "bar", "heatmap", "dendrogram"], h => ({
    value: h,
    label: t(`missing:${_.capitalize(h)}`),
  }));

const buildUrls = (dataId, { dateCol, freq, chartType }) => {
  const imageUrl = buildURLString(menuFuncs.fullPath(`/dtale/missingno/${chartType}`, dataId), {
    date_index: _.get(dateCol, "name"),
    freq: _.get(freq, "value"),
    id: new Date().getTime(),
  });
  const fileUrl = buildURLString(menuFuncs.fullPath(`/dtale/missingno/${chartType}`, dataId), {
    date_index: _.get(dateCol, "name"),
    freq: _.get(freq, "value"),
    file: true,
    id: new Date().getTime(),
  });
  return { imageUrl, fileUrl };
};

const FREQS = _.concat(
  ["B", "C", "D", "W", "M", "SM", "BM", "CBM", "MS", "SMS", "BMS", "CBMS", "Q", "BQ", "QS", "BQS", "Y", "BY"],
  ["YS", "BYS", "BH", "H", "T", "S", "L", "U", "N"]
);
const freqOpts = t => FREQS.map(f => ({ label: `${f} - ${t(f, { ns: "missing" })}`, value: f }));

class ReactMissingNoCharts extends React.Component {
  constructor(props) {
    super(props);
    const state = {
      dtypes: null,
      chartType: "matrix",
      freq: freqOpts(props.t).find(f => f.value === "BQ"),
      dateCol: null,
      dateCols: [],
      imageLoading: true,
    };
    const files = buildUrls(props.dataId, state);
    this.state = { ...state, ...files };
  }

  componentDidMount() {
    fetchJson(dtypesUrl(this.props.dataId), dtypesData => {
      const newState = {
        error: null,
      };
      if (dtypesData.error) {
        this.setState({ error: <RemovableError {...dtypesData} /> });
        return;
      }
      newState.dtypes = dtypesData.dtypes;
      newState.dateCols = _.filter(newState.dtypes, col => gu.isDateCol(col.dtype));
      this.setState(newState);
    });
  }

  componentDidUpdate(_prevProps, prevState) {
    const imgState = ["chartType", "freq", "dateCol"];
    if (!_.isEqual(_.pick(this.state, imgState), _.pick(prevState, imgState))) {
      this.setState({
        imageLoading: true,
        error: null,
        ...buildUrls(this.props.dataId, this.state),
      });
    }
  }

  render() {
    const { t } = this.props;
    const { chartType, imageLoading, imageUrl, fileUrl } = this.state;
    return (
      <>
        {this.state.error}
        <div className="row ml-0 mr-0">
          <div className="col-auto pl-0">
            <h2>{t("Missing Analysis", { ns: "menu" })}</h2>
          </div>
          <div className="col" />
          <div className="col-auto pr-0">
            <button className="btn btn-plain" onClick={() => window.open(imageUrl, "_blank")}>
              <i className="ico-open-in-new pointer" title={t("Open In New Tab", { ns: "side" })} />
            </button>
          </div>
          <div className="col-auto pr-0">
            <button className="btn btn-plain" onClick={() => window.open(fileUrl, "_blank")}>
              <i className="fas fa-file-code pointer" title={t("missing:Download")} />
            </button>
          </div>
          <div className="col-auto">
            <button className="btn btn-plain" onClick={this.props.hideSidePanel}>
              <i className="ico-close pointer" title={t("side:Close")} />
            </button>
          </div>
        </div>
        <div className="row ml-0 mr-0 missingno-inputs">
          <ButtonToggle
            options={chartOpts(t)}
            update={chartType => this.setState({ chartType })}
            defaultValue={chartType}
            disabled={imageLoading}
          />
          {this.state.dateCols.length > 0 && chartType === "matrix" && (
            <>
              <div className="col-auto">
                <ColumnSelect
                  label={t("builders:Date")}
                  prop="dateCol"
                  parent={this.state}
                  updateState={state => this.setState(state)}
                  columns={this.state.dateCols}
                />
              </div>
              <div className="col-auto">
                <div className="form-group row">
                  <label className="col-md-3 col-form-label text-right">{t("missing:Freq")}</label>
                  <div className="col-md-8">
                    <div className="input-group">
                      <FilterSelect
                        selectProps={{
                          value: this.state.freq,
                          options: freqOpts(t),
                          onChange: v => this.setState({ freq: v }),
                        }}
                        labelProp="label"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="col" />
        </div>
        <div className="row h-100">
          <BouncerWrapper showBouncer={imageLoading}>{null}</BouncerWrapper>
          <div className="col image-frame" hidden={imageLoading}>
            <img
              src={imageUrl}
              onLoad={() => {
                this.setState({ imageLoading: false });
              }}
              onError={() =>
                this.setState({
                  imageLoading: false,
                  error: <RemovableError error="Chart could not be loaded!" />,
                })
              }
            />
          </div>
        </div>
      </>
    );
  }
}
ReactMissingNoCharts.displayName = "ReactMissingNoCharts";
ReactMissingNoCharts.propTypes = {
  dataId: PropTypes.string,
  hideSidePanel: PropTypes.func,
  t: PropTypes.func,
};
const TranslatedMissingNoCharts = withTranslation(["menu", "missing", "side", "builders"])(ReactMissingNoCharts);
const ReduxMissingNoCharts = connect(
  ({ dataId }) => ({ dataId }),
  dispatch => ({ hideSidePanel: () => dispatch({ type: "hide-side-panel" }) })
)(TranslatedMissingNoCharts);
export { ReduxMissingNoCharts as MissingNoCharts, TranslatedMissingNoCharts as ReactMissingNoCharts };
