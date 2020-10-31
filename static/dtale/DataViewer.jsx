// eslint-disable-next-line no-unused-vars
import scrollbarSize from "dom-helpers/scrollbarSize";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import InfiniteLoader from "react-virtualized/dist/commonjs/InfiniteLoader";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { openChart } from "../actions/charts";
import actions from "../actions/dtale";
import { buildURLParams, buildURLString } from "../actions/url-utils";
import { fetchJsonPromise, logException } from "../fetcher";
import { Popup } from "../popups/Popup";
import Formatting from "../popups/formats/Formatting";
import { DataViewerInfo } from "./DataViewerInfo";
import { DtaleHotkeys } from "./DtaleHotkeys";
import { GridCell } from "./GridCell";
import { GridEventHandler } from "./GridEventHandler";
import { MeasureText } from "./MeasureText";
import { ColumnMenu } from "./column/ColumnMenu";
import { exports as gu } from "./gridUtils";
import Descriptions from "./menu-descriptions.json";
import { DataViewerMenu } from "./menu/DataViewerMenu";

require("./DataViewer.css");
const URL_PROPS = ["ids", "sortInfo"];
const FUNCS = ["_cellRenderer", "_onSectionRendered", "propagateState", "getData"];

class ReactDataViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = gu.buildState(props);
    _.forEach(FUNCS, f => (this[f] = this[f].bind(this)));
    this.clickTimeout = null;
  }

  componentDidMount() {
    this.getData(this.state.ids);
  }

  propagateState(state, callback = _.noop) {
    if (_.has(state, "columns") && !_.get(state, "formattingUpdate", false)) {
      state.columns = gu.updateColWidths(this.state, state);
      state = _.assignIn(state, gu.getTotalRange(state.columns));
    }
    if (_.has(state, "renameUpdate")) {
      state.data = state.renameUpdate(this.state.data);
    }
    if (_.has(state, "triggerBgResize")) {
      state.columns = gu.updateColWidths(this.state, state);
      state.triggerResize = true;
    }
    if (_.get(state, "refresh", false)) {
      this.getData(this.state.ids, true);
      callback();
      return;
    }
    this.setState(_.omit(state, ["formattingUpdate", "renameUpdate", "triggerBgResize"]), callback);
  }

  componentDidUpdate(prevProps, prevState) {
    const gridState = ["sortInfo", "query", "columnFilters", "outlierFilters"];
    const refresh = !_.isEqual(_.pick(this.state, gridState), _.pick(prevState, gridState));
    if (!this.state.loading && prevState.loading) {
      if (!_.isEmpty(this.state.loadQueue)) {
        const ids = _.last(this.state.loadQueue);
        this.setState({ loadQueue: [] });
        if (!_.isEqual(ids, this.state.ids)) {
          this.getData(ids, refresh);
          return;
        }
      }
    }
    if (refresh) {
      this.getData(this.state.ids, refresh);
    }
    if (this.state.triggerResize) {
      this.setState({ triggerResize: false }, () => {
        if (_.size(this.state.data)) {
          this._grid.forceUpdate();
          this._grid.recomputeGridSize();
        }
      });
      return;
    }
    const currWidth = _.sum(_.map(gu.getActiveCols(this.state), "width"));
    const prevWidth = _.sum(_.map(gu.getActiveCols(prevState), "width"));
    if (currWidth != prevWidth) {
      this.setState({ triggerResize: true });
      return;
    }

    if (prevProps.darkMode !== this.props.darkMode) {
      this.setState({
        styleBottomLeftGrid: {
          ...gu.buildGridStyles(this.props.darkMode).styleBottomLeftGrid,
        },
      });
    }
  }

  getData(ids, refresh = false) {
    const { loading, loadQueue, backgroundMode } = this.state;
    const data = this.state.data || {};
    if (loading) {
      this.setState({ loadQueue: _.concat(loadQueue, [ids]) });
      return;
    } else {
      this.setState({ loading: true, ids });
    }
    let newIds = [`${ids[0]}-${ids[1]}`];
    let savedData = {};
    if (!refresh) {
      newIds = gu.getRanges(_.filter(_.range(ids[0], ids[1] + 1), i => !_.has(data, i)));
      savedData = _.pick(data, _.range(ids[0], ids[1] + 1));
      // Make sure we check to see if the data we are saving is the actual data being displayed by the grid
      const currGrid = _.get(this._grid, "_bottomRightGrid");
      if (currGrid) {
        const currGridIds = _.range(currGrid._renderedRowStartIndex, currGrid._renderedRowEndIndex);
        savedData = _.assignIn(savedData, _.pick(data, currGridIds));
      }
    }
    if (_.isEmpty(newIds)) {
      this.setState({ loading: false });
      return;
    }
    const params = buildURLParams(_.assignIn({}, this.state, { ids: newIds }), URL_PROPS);
    if (_.isEmpty(params)) {
      console.log(["Empty params!", { ids, newIds, data: this.state.data }]); // eslint-disable-line no-console
      this.setState({ loading: false });
      return; // I've seen issues with react-virtualized where it will get into this method without parameters
    }
    const url = buildURLString(`/dtale/data/${this.props.dataId}?`, params);
    fetchJsonPromise(url)
      .then(data => {
        const formattedData = _.mapValues(data.results, d =>
          _.mapValues(d, (val, col) => gu.buildDataProps(_.find(data.columns, { name: col }), val, this.state))
        );
        if (data.error) {
          this.setState({
            ..._.pick(data, ["error", "traceback"]),
            loading: false,
          });
          return;
        }
        let newState = {
          rowCount: data.total + 1,
          data: _.assignIn(savedData, formattedData),
          error: null,
          traceback: null,
          loading: false,
          backgroundMode,
        };
        const { columns } = this.state;
        if (_.isEmpty(columns)) {
          const preLocked = _.concat(_.get(this.props, "settings.locked", []), [gu.IDX]);
          newState.columns = _.map(data.columns, c =>
            _.assignIn(
              {
                locked: _.includes(preLocked, c.name),
                width: gu.calcColWidth(c, newState),
              },
              c
            )
          );
          newState = _.assignIn(newState, gu.getTotalRange(newState.columns));
        } else {
          newState = gu.refreshColumns(data, columns, newState);
        }
        let callback = _.noop;
        if (refresh) {
          callback = () =>
            this.setState({
              columns: _.map(this.state.columns, c => _.assignIn(c, { width: gu.calcColWidth(c, this.state) })),
              triggerResize: true,
            });
        }
        this.setState(newState, callback);
      })
      .catch((e, callstack) => {
        logException(e, callstack);
      });
  }

  _cellRenderer({ columnIndex, _isScrolling, key, rowIndex, style }) {
    return (
      <GridCell
        {...{ columnIndex, key, rowIndex, style }}
        gridState={this.state}
        propagateState={this.propagateState}
      />
    );
  }

  _onSectionRendered({ columnStartIndex, columnStopIndex, rowStartIndex, rowStopIndex }) {
    const { ids } = this.state;
    const columnCount = gu.getActiveCols(this.state).length;
    const startIndex = rowStartIndex * columnCount + columnStartIndex;
    const stopIndex = rowStopIndex * columnCount + columnStopIndex;
    const newIds = _.difference(_.range(rowStartIndex, rowStopIndex + 1), _.range(ids[0], ids[1] + 1));
    if (_.isEmpty(newIds) || newIds.length < 2) {
      return;
    }
    this.getData([rowStartIndex, rowStopIndex]);
    this._onRowsRendered({ startIndex, stopIndex });
  }

  render() {
    const { formattingOpen } = this.state;
    return (
      <GridEventHandler propagateState={this.propagateState} gridState={this.state}>
        <DtaleHotkeys propagateState={this.propagateState} />
        <InfiniteLoader
          isRowLoaded={({ index }) => _.has(this.state, ["data", index])}
          loadMoreRows={_.noop}
          rowCount={this.state.rowCount}>
          {({ onRowsRendered }) => {
            this._onRowsRendered = onRowsRendered;
            return (
              <AutoSizer className="main-grid" onResize={() => this._grid.recomputeGridSize()}>
                {({ width, height }) => {
                  const gridHeight = height - (gu.hasNoInfo(this.state) ? 3 : 23);
                  return [
                    <DataViewerInfo key={0} width={width} {...this.state} propagateState={this.propagateState} />,
                    <MultiGrid
                      {...this.state}
                      key={1}
                      columnCount={gu.getActiveCols(this.state).length}
                      onScroll={this.props.closeColumnMenu}
                      cellRenderer={this._cellRenderer}
                      height={gridHeight}
                      width={width - 3}
                      columnWidth={({ index }) => gu.getColWidth(index, this.state)}
                      onSectionRendered={this._onSectionRendered}
                      ref={mg => (this._grid = mg)}
                    />,
                  ];
                }}
              </AutoSizer>
            );
          }}
        </InfiniteLoader>
        <DataViewerMenu {...this.state} propagateState={this.propagateState} />
        <Popup propagateState={this.propagateState} />
        <Formatting
          {..._.pick(this.state, ["data", "columns", "columnFormats", "nanDisplay"])}
          selectedCol={_.get(this.state.selectedCols, "0")}
          dataId={this.props.dataId}
          visible={formattingOpen}
          propagateState={this.propagateState}
        />
        <MeasureText />
        <ColumnMenu
          {..._.pick(this.state, ["columns", "sortInfo", "columnFilters", "outlierFilters", "error"])}
          propagateState={this.propagateState}
          noInfo={gu.hasNoInfo(this.state)}
        />
        <div id="edit-tt" className="hoverable__content edit-cell" style={{ display: "none" }}>
          {Descriptions.editing}
        </div>
      </GridEventHandler>
    );
  }
}
ReactDataViewer.displayName = "ReactDataViewer";
ReactDataViewer.propTypes = {
  settings: PropTypes.object,
  dataId: PropTypes.string.isRequired,
  iframe: PropTypes.bool,
  closeColumnMenu: PropTypes.func,
  openChart: PropTypes.func,
  darkMode: PropTypes.bool,
};

const ReduxDataViewer = connect(
  ({ dataId, iframe, darkMode }) => ({ dataId, iframe, darkMode }),
  dispatch => ({
    closeColumnMenu: () => dispatch(actions.closeColumnMenu()),
    openChart: chartProps => dispatch(openChart(chartProps)),
  })
)(ReactDataViewer);

export { ReduxDataViewer as DataViewer, ReactDataViewer };
