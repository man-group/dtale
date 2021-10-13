// eslint-disable-next-line no-unused-vars
import scrollbarSize from "dom-helpers/scrollbarSize";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Draggable from "react-draggable";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

import { BouncerWrapper } from "../../BouncerWrapper";
import * as gu from "../../dtale/gridUtils";
import { SidePanelButtons } from "../../dtale/side/SidePanelButtons";
import { renderCodePopupAnchor } from "../CodePopup";
import CorrelationsCell from "./CorrelationsCell";
import corrUtils from "./correlationsUtils";

require("./CorrelationsGrid.css");

export function updateSort(currSort, col) {
  if (currSort && currSort[0] === col) {
    return currSort[1] === "DESC" ? null : [col, "DESC"];
  }
  return [col, "ASC"];
}

export function sortData(data, sort) {
  let sortedData = _.clone(data);
  if (sort) {
    sortedData = _.orderBy(sortedData, [sort[0]], [sort[1].toLowerCase()]);
  }
  return sortedData;
}

function filterData({ col1, col2 }, data, currSort) {
  let updatedData = sortData(data, currSort);
  if (!_.isNull(col1)) {
    updatedData = _.filter(data, { column: col1.value });
  }
  if (!_.isNull(col2)) {
    updatedData = _.map(updatedData, r => _.pick(r, ["column", col2.value]));
  }
  return updatedData;
}

function buildState({ correlations, columns, col1, col2 }, filter = true) {
  const state = {
    columns: _.map(columns, column => ({ value: column })),
    col1: col1 ? { value: col1 } : null,
    col2: col2 ? { value: col2 } : null,
    height: 300,
    currSort: null,
  };
  state.correlations = filter ? filterData(state, correlations) : _.clone(correlations);
  return state;
}

class CorrelationsGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = buildState(props, false);
    this._cellRenderer = this._cellRenderer.bind(this);
    this.updateSort = this.updateSort.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props.correlations, prevProps.correlations)) {
      this.setState(buildState(this.props));
    }
  }

  updateSort(col) {
    const updatedSort = updateSort(this.state.currSort, col);
    const sortedData = sortData(this.props.correlations, updatedSort);
    this.setState({ currSort: updatedSort, correlations: sortedData });
  }

  _cellRenderer(cellProps) {
    const mainProps = _.pick(this.props, [
      "hasDate",
      "selectedDate",
      "rolling",
      "useRolling",
      "window",
      "minPeriods",
      "buildTs",
      "buildScatter",
      "selectedCols",
      "colorScale",
    ]);
    const props = _.assignIn(mainProps, this.state, cellProps);
    return <CorrelationsCell {...props} updateSort={this.updateSort} />;
  }

  renderSelect(prop, otherProp) {
    const { correlations, t } = this.props;
    const { columns, currSort } = this.state;
    const finalOptions = _.isNull(this.state[otherProp]) ? columns : _.reject(columns, this.state[otherProp]);
    const onChange = selected => {
      const filterState = {
        [prop]: selected,
        [otherProp]: this.state[otherProp],
      };
      this.setState({
        [prop]: selected,
        correlations: filterData(filterState, correlations, currSort),
      });
    };
    return (
      <div className="input-group mr-3">
        <Select
          className="Select is-clearable is-searchable Select--single"
          classNamePrefix="Select"
          options={_.sortBy(finalOptions, o => _.toLower(o.value))}
          getOptionLabel={_.property("value")}
          getOptionValue={_.property("value")}
          value={this.state[prop]}
          onChange={onChange}
          noOptionsText={() => t("No columns found", { ns: "correlations" })}
          isClearable
          filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
        />
      </div>
    );
  }

  render() {
    const { t } = this.props;
    const { correlations, columns, col1, col2 } = this.state;
    return (
      <BouncerWrapper showBouncer={_.isEmpty(this.props.correlations)}>
        <div className="row pb-5">
          <div className="col-auto p-0">
            <h2 className="m-0">
              {!this.props.isPPS && t("Pearson Correlation Matrix", { ns: "correlations" })}
              {this.props.isPPS && t("Predictive Power Score", { ns: "menu" })}
            </h2>
            <small>
              (
              {t("Click on any cell to view the details of that correlation", {
                ns: "correlations",
              })}
              )
            </small>
          </div>
          <div className="col" />
          <SidePanelButtons />
        </div>
        <AutoSizer className="correlations-grid" disableHeight>
          {({ width }) => (
            <>
              <div style={{ width }} className="row pt-3 pb-3 correlations-filters">
                <span className="mb-auto mt-auto">{t("View Correlation(s) For", { ns: "correlations" })}</span>
                <div className="col-auto">{this.renderSelect("col1", "col2")}</div>
                <span className="mb-auto mt-auto">{t("vs.", { ns: "correlations" })}</span>
                <div className="col-auto">{this.renderSelect("col2", "col1")}</div>
                <div className="col pr-0 text-right">
                  {renderCodePopupAnchor(this.props.gridCode, t("Correlations", { ns: "menu" }))}
                </div>
              </div>
              {this.props.strings.length && (
                <div style={{ width }} className="row pt-3 pb-3 correlations-filters">
                  <span className="mb-auto mt-auto">{t("Encode Strings", { ns: "correlations" })}?</span>
                  <div className="col-auto mt-auto mb-auto pl-5 hoverable" style={{ borderBottom: "none" }}>
                    <i
                      className={`ico-check-box${this.props.encodeStrings ? "" : "-outline-blank"} pointer`}
                      onClick={this.props.toggleStrings}
                    />
                    <div className="hoverable__content encode-strings">
                      {`${t("correlations:encode_strings_tt")} ${this.props.strings.join(", ")}`}
                    </div>
                  </div>
                </div>
              )}
              <MultiGrid
                {...gu.buildGridStyles(this.props.theme)}
                scrollToColumn={0}
                scrollToRow={0}
                cellRenderer={this._cellRenderer}
                fixedColumnCount={1}
                fixedRowCount={1}
                rowCount={(_.isNull(col1) ? _.size(correlations) : 1) + 1}
                columnCount={(_.isNull(col2) ? _.size(columns) : 1) + 1}
                height={this.state.height}
                columnWidth={100}
                rowHeight={gu.ROW_HEIGHT}
                width={width}
              />
              <Draggable
                axis="y"
                defaultClassName="CorrDragHandle"
                defaultClassNameDragging="CorrDragHandleActive"
                onDrag={(_e, { deltaY }) =>
                  this.setState({
                    height: _.max([this.state.height + deltaY, 300]),
                  })
                }
                position={{ y: 0 }}
                zIndex={999}>
                <div className="CorrDragHandleIcon">...</div>
              </Draggable>
            </>
          )}
        </AutoSizer>
      </BouncerWrapper>
    );
  }
}
CorrelationsGrid.displayName = "CorrelationsGrid";
CorrelationsGrid.propTypes = {
  correlations: PropTypes.array,
  columns: PropTypes.arrayOf(PropTypes.string),
  hasDate: PropTypes.bool,
  selectedDate: PropTypes.string,
  selectedCols: PropTypes.arrayOf(PropTypes.string),
  buildTs: PropTypes.func,
  buildScatter: PropTypes.func,
  rolling: PropTypes.bool,
  useRolling: PropTypes.bool,
  window: PropTypes.number,
  minPeriods: PropTypes.number,
  gridCode: PropTypes.string,
  theme: PropTypes.string,
  colorScale: PropTypes.func,
  t: PropTypes.func,
  close: PropTypes.node,
  isPPS: PropTypes.bool,
  strings: PropTypes.array,
  encodeStrings: PropTypes.bool,
  toggleStrings: PropTypes.func,
};
CorrelationsGrid.defaultProps = {
  colorScale: corrUtils.colorScale,
  isPPS: false,
};

export default withTranslation(["correlations", "menu"])(CorrelationsGrid);
