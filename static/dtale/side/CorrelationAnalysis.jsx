import _ from "lodash";
import numeral from "numeral";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import Column from "react-virtualized/dist/commonjs/Table/Column";
import Table from "react-virtualized/dist/commonjs/Table/Table";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { openChart } from "../../actions/charts";
import { corrAnalysisUrl } from "../../actions/url-utils";
import { SORT_CHARS } from "../../dtale/Header";
import { fetchJson } from "../../fetcher";
import { sortData, updateSort } from "../../popups/correlations/CorrelationsGrid";
import { StyledSlider, Thumb, Track } from "../../sliderUtils";
import * as gu from "../gridUtils";
import serverStateManagement from "../serverStateManagement";

function buildData({ corrs, ranks }, { threshold, selections }) {
  const data = _.map(ranks, row => ({
    ...row,
    selected: selections[row.column] ?? false,
    corrs: _.size(_.filter(corrs[row.column], corr => corr > threshold)),
  }));
  return data;
}

class ReactCorrelationAnalysis extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      currSort: null,
      selections: {},
      threshold: 0.5,
    };
    this.renderGrid = this.renderGrid.bind(this);
    this.updateThreshold = this.updateThreshold.bind(this);
    this.headerRenderer = this.headerRenderer.bind(this);
  }

  componentDidMount() {
    fetchJson(corrAnalysisUrl(this.props.dataId), analysisData => {
      if (analysisData.error) {
        this.setState({
          error: <RemovableError {...analysisData} />,
          loading: false,
        });
        return;
      }
      const { corrs, ranks } = analysisData;
      const data = buildData(analysisData, this.state);
      const selections = _.reduce(ranks, (res, row) => ({ ...res, [row.column]: true }), {});
      this.setState({
        corrs,
        ranks,
        data,
        selections,
        error: null,
        loading: false,
      });
    });
  }

  headerRenderer({ dataKey, label }) {
    const { currSort } = this.state;
    if (dataKey === "selected") {
      return <div className="headerCell">{label}</div>;
    }
    const onClick = () => {
      const data = buildData(this.state, this.state);
      const updatedSort = updateSort(currSort, dataKey);
      const sortedData = sortData(data, updatedSort);
      this.setState({ currSort: updatedSort, data: sortedData });
    };
    const [sortBy, sortDir] = currSort === null ? [null, null] : currSort;
    return (
      <div className="headerCell pointer" onClick={onClick}>
        <div className="row">
          <div className="col-auto" style={{ whiteSpace: "break-spaces" }}>
            {dataKey === sortBy ? `${_.get(SORT_CHARS, sortDir, "")} ` : ""}
            {label}
          </div>
        </div>
      </div>
    );
  }

  renderGrid() {
    if (!_.isEmpty(this.state.error)) {
      return this.state.error;
    }
    const { t } = this.props;
    const { data } = this.state;
    const toggleSelected =
      ({ column }) =>
      e => {
        const { threshold } = this.state;
        const selections = {
          ...this.state.selections,
          [column]: !this.state.selections[column],
        };
        const data = buildData(this.state, { threshold, selections });
        this.setState({ data, selections });
        e.stopPropagation();
      };
    return (
      <AutoSizer>
        {({ height, width }) => (
          <Table
            headerHeight={40}
            height={height < 400 ? 400 : height}
            overscanRowCount={10}
            rowStyle={{ display: "flex" }}
            rowHeight={gu.ROW_HEIGHT}
            rowGetter={({ index }) => data[index]}
            rowCount={_.size(data)}
            width={width}>
            <Column
              dataKey="selected"
              label={t("corr_analysis:Keep")}
              headerRenderer={this.headerRenderer}
              width={60}
              style={{ textAlign: "left", paddingLeft: ".5em" }}
              className="cell"
              cellRenderer={({ rowData }) => (
                <div onClick={toggleSelected(rowData)} className="text-center pointer">
                  <i className={`ico-check-box${this.state.selections[rowData.column] ? "" : "-outline-blank"}`} />
                </div>
              )}
            />
            <Column
              dataKey="column"
              label={t("corr_analysis:Column")}
              headerRenderer={this.headerRenderer}
              width={200}
              flexGrow={1}
              style={{ textAlign: "left", paddingLeft: ".5em" }}
              className="cell"
            />
            <Column
              dataKey="score"
              label={t("Max Correlation w/ Other Columns", {
                ns: "corr_analysis",
              })}
              headerRenderer={this.headerRenderer}
              width={100}
              flexGrow={1}
              style={{ textAlign: "left", paddingLeft: ".5em" }}
              className="cell"
              cellRenderer={({ rowData }) =>
                rowData.score === "N/A" ? rowData.score : numeral(rowData.score).format("0.00")
              }
            />
            <Column
              dataKey="corrs"
              label={`${t("corr_analysis:Correlations")}\n${t("Above Threshold", { ns: "corr_analysis" })}`}
              headerRenderer={this.headerRenderer}
              width={100}
              flexGrow={1}
              style={{ textAlign: "left", paddingLeft: ".5em" }}
              className="cell"
            />
            <Column
              width={100}
              dataKey="missing"
              label={t("Missing Rows", { ns: "corr_analysis" })}
              headerRenderer={this.headerRenderer}
              className="cell"
            />
          </Table>
        )}
      </AutoSizer>
    );
  }

  updateThreshold(threshold) {
    const { corrs, data } = this.state;
    const updatedData = _.map(data, row => ({
      ...row,
      corrs: _.size(_.filter(corrs[row.column], corr => corr > threshold)),
    }));
    this.setState({ data: updatedData, threshold });
  }

  render() {
    const { dataId, t, openChart, hideSidePanel } = this.props;
    const hasUnselected = _.find(this.state.selections, selected => selected === false) !== undefined;
    const dropColumns = () => {
      const colsToDrop = _.keys(_.pickBy(this.state.selections, selected => !selected));
      const title = `${t("Drop Columns", { ns: "corr_analysis" })}?`;
      const msg = `Are you sure you would like to drop the following columns? ${colsToDrop.join(", ")}`;
      const yesAction = () => {
        serverStateManagement.deleteColumns(dataId, colsToDrop)();
        this.props.dropColumns(colsToDrop);
        hideSidePanel();
      };
      openChart({ type: "confirm", title, msg, yesAction, size: "sm" });
    };
    return (
      <>
        {this.state.error}
        <div className="row ml-0 mr-0">
          <div className="col-auto pl-0">
            <h2>{t("Feature Analysis by Correlation", { ns: "side" })}</h2>
          </div>
          <div className="col" />
          <div className="col-auto">
            <button className="btn btn-plain" onClick={this.props.hideSidePanel}>
              <i className="ico-close pointer" title={t("side:Close")} />
            </button>
          </div>
        </div>
        <div>
          <span className="d-inline-block pr-5 align-top mt-3">{t("corr_analysis:Threshold")}</span>
          <div className="d-inline-block" style={{ width: 200 }}>
            <StyledSlider
              renderTrack={Track}
              renderThumb={Thumb}
              value={this.state.threshold}
              min={0.0}
              max={1.0}
              step={0.01}
              onAfterChange={threshold => this.updateThreshold(threshold)}
            />
          </div>
          {hasUnselected && (
            <button className="btn btn-primary float-right pt-2 pb-2 d-inline-block" onClick={dropColumns}>
              <span>
                {this.props.t("Drop Unselected Columns", {
                  ns: "corr_analysis",
                })}
                ?
              </span>
            </button>
          )}
        </div>
        <div className="row h-100">
          <div className="col">
            <BouncerWrapper showBouncer={this.state.loading}>{this.renderGrid()}</BouncerWrapper>
          </div>
        </div>
      </>
    );
  }
}
ReactCorrelationAnalysis.displayName = "ReactCorrelationAnalysis";
ReactCorrelationAnalysis.propTypes = {
  dataId: PropTypes.string,
  hideSidePanel: PropTypes.func,
  dropColumns: PropTypes.func,
  openChart: PropTypes.func,
  t: PropTypes.func,
};
const TranslatedCorrelationAnalysis = withTranslation(["menu", "corr_analysis", "side"])(ReactCorrelationAnalysis);
const ReduxCorrelationAnalysis = connect(
  ({ dataId }) => ({ dataId }),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    dropColumns: columns =>
      dispatch({
        type: "data-viewer-update",
        update: { type: "drop-columns", columns },
      }),
    hideSidePanel: () => dispatch({ type: "hide-side-panel" }),
  })
)(TranslatedCorrelationAnalysis);
export { ReduxCorrelationAnalysis as CorrelationAnalysis, TranslatedCorrelationAnalysis as ReactCorrelationAnalysis };
