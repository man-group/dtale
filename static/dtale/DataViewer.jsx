// eslint-disable-next-line no-unused-vars
import scrollbarSize from "dom-helpers/scrollbarSize";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import InfiniteLoader from "react-virtualized/dist/commonjs/InfiniteLoader";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { buildURLParams, buildURLString } from "../actions/url-utils";
import { fetchJsonPromise, logException } from "../fetcher";
import { Popup } from "../popups/Popup";
import { DataViewerInfo, hasNoInfo } from "./DataViewerInfo";
import { DataViewerMenu } from "./DataViewerMenu";
import Filter from "./Filter";
import { Formatting } from "./Formatting";
import Header from "./Header";
import { MeasureText } from "./MeasureText";
import * as gu from "./gridUtils";

require("./DataViewer.css");
const URL_PROPS = ["ids", "sortInfo", "query"];

class ReactDataViewer extends React.Component {
  constructor(props) {
    super(props);
    const state = {
      columnCount: 0,
      numberFormats: _.get(props.settings, "formats", {}),
      overscanColumnCount: 0,
      overscanRowCount: 5,
      rowHeight: ({ index }) => (index == 0 ? gu.HEADER_HEIGHT : gu.ROW_HEIGHT),
      rowCount: 0,
      fixedColumnCount: _.size(_.concat(_.get(this.props, "settings.locked", []), [gu.IDX])),
      fixedRowCount: 1,
      data: {},
      loading: false,
      ids: [0, 55],
      loadQueue: [],
      columns: [],
      query: _.get(props.settings, "query", ""),
      sortInfo: _.get(props.settings, "sort", []),
      selectedCols: [],
      menuOpen: false,
      filterOpen: false,
      formattingOpen: false,
      triggerResize: false,
    };
    this.state = _.assignIn(state, gu.buildGridStyles());
    this._cellRenderer = this._cellRenderer.bind(this);
    this._onSectionRendered = this._onSectionRendered.bind(this);
    this.propagateState = this.propagateState.bind(this);
    this.getData = this.getData.bind(this);
  }

  propagateState(state) {
    if (_.has(state, "columns")) {
      state.columns = _.map(state.columns, c => _.assignIn(c, { width: gu.calcColWidth(c, this.state) }));
    }
    this.setState(state);
  }

  componentDidMount() {
    this.getData(this.state.ids);
  }

  componentDidUpdate(_prevProps, prevState) {
    const gridState = ["sortInfo", "query"];
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
        this._grid.forceUpdate();
        this._grid.recomputeGridSize();
      });
      return;
    }
    const widthChange = _.sum(_.map(this.state.columns, "width")) != _.sum(_.map(prevState.columns, "width"));
    if (widthChange) {
      this.setState({ triggerResize: true });
      return;
    }
  }

  getData(ids, refresh = false) {
    const { loading, loadQueue } = this.state;
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
    const url = buildURLString("/dtale/data?", params);
    fetchJsonPromise(url)
      .then(data => {
        const formattedData = _.mapValues(data.results, d =>
          _.mapValues(d, (val, col) => gu.buildDataProps(_.find(data.columns, { name: col }), val, this.state))
        );
        if (data.error) {
          this.setState({ loading: false, error: data.error, traceback: data.traceback });
          return;
        }
        const newState = {
          rowCount: data.total + 1,
          columnCount: data.columns.length,
          data: _.assignIn(savedData, formattedData),
          loading: false,
        };
        const { columns } = this.state;
        if (_.isEmpty(columns)) {
          const preLocked = _.concat(_.get(this.props, "settings.locked", []), [gu.IDX]);
          newState.columns = _.map(data.columns, c =>
            _.assignIn({ locked: _.includes(preLocked, c.name), width: gu.calcColWidth(c, newState) }, c)
          );
        } else {
          const newCols = _.map(_.filter(data.columns, ({ name }) => !_.find(columns, { name })), c =>
            _.assignIn({ locked: false, width: gu.calcColWidth(c, newState) }, c)
          );
          newState.columns = _.concat(columns, newCols);
        }
        this.setState(newState);
      })
      .catch((e, callstack) => {
        logException(e, callstack);
      });
  }

  _cellRenderer({ columnIndex, _isScrolling, key, rowIndex, style }) {
    if (rowIndex == 0) {
      return (
        <Header
          {...this.state}
          key={key}
          columnIndex={columnIndex}
          style={style}
          propagateState={this.propagateState}
        />
      );
    }
    const colCfg = _.get(this.state, ["columns", columnIndex], {});
    let value = "-";
    let valueStyle = {};
    if (colCfg.name) {
      const rec = _.get(this.state, ["data", rowIndex - 1, colCfg.name], {});
      value = rec.view;
      valueStyle = rec.style;
    }
    return (
      <div className="cell" key={key} style={_.assignIn(style, valueStyle)}>
        {value}
      </div>
    );
  }

  _onSectionRendered({ columnStartIndex, columnStopIndex, rowStartIndex, rowStopIndex }) {
    const { ids, columnCount } = this.state;
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
    const { data, filterOpen, formattingOpen, query, columns, numberFormats, selectedCols } = this.state;
    const saveFormatting = ({ fmt, style }) => {
      const updatedNumberFormats = _.assignIn(
        {},
        numberFormats,
        _.reduce(selectedCols, (res, col) => _.assignIn(res, { [col]: { fmt, style } }), {})
      );
      const updatedData = _.mapValues(data, d =>
        _.assignIn(
          {},
          d,
          _.mapValues(_.pick(d, selectedCols), (v, k) => {
            const colCfg = _.find(this.state.columns, { name: k }, {});
            return gu.buildDataProps(colCfg, v.raw, { numberFormats: { [colCfg.name]: { fmt, style } } });
          })
        )
      );
      const updatedCols = _.map(columns, c => {
        if (_.includes(selectedCols, c.name)) {
          return _.assignIn({}, c, { width: gu.calcColWidth(c, _.assignIn({}, this.state, { data: updatedData })) });
        }
        return c;
      });
      this.setState({
        data: updatedData,
        numberFormats: updatedNumberFormats,
        columns: updatedCols,
        formattingOpen: false,
        triggerResize: true,
      });
      const updateParams = { settings: JSON.stringify({ formats: updatedNumberFormats }) };
      fetchJsonPromise(buildURLString("/dtale/update-settings?", updateParams))
        .then(_.noop)
        .catch((e, callstack) => {
          logException(e, callstack);
        });
    };
    return (
      <div key={1} style={{ height: "100%", width: "100%" }}>
        <InfiniteLoader
          isRowLoaded={({ index }) => _.has(this.state, ["data", index])}
          loadMoreRows={_.noop}
          rowCount={this.state.rowCount}>
          {({ onRowsRendered }) => {
            this._onRowsRendered = onRowsRendered;
            return (
              <AutoSizer className="main-grid" onResize={() => this._grid.recomputeGridSize()}>
                {({ width, height }) => {
                  const gridHeight = height - (hasNoInfo(this.state) ? 3 : 23);
                  return [
                    <DataViewerInfo key={0} width={width} {...this.state} propagateState={this.propagateState} />,
                    <MultiGrid
                      {...this.state}
                      key={1}
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
        <Filter {...{ visible: filterOpen, propagateState: this.propagateState, query }} />
        <Formatting {...{ visible: formattingOpen, save: saveFormatting, propagateState: this.propagateState }} />
        <MeasureText />
      </div>
    );
  }
}
ReactDataViewer.displayName = "ReactDataViewer";
ReactDataViewer.propTypes = {
  settings: PropTypes.object,
};

const ReduxDataViewer = connect()(ReactDataViewer);

export { ReduxDataViewer as DataViewer, ReactDataViewer };
