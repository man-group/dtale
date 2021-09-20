import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { openChart } from "../actions/charts";
import { GridCellEditor } from "./GridCellEditor";
import { Header } from "./Header";
import bu from "./backgroundUtils";
import * as gu from "./gridUtils";
import { isInRange } from "./rangeSelectUtils";

function buildStyle(rec, valueStyle, gridState, colCfg) {
  const style = { ...valueStyle, ..._.get(rec, "style") };
  const backgroundStyle = bu.updateBackgroundStyles(gridState, colCfg, rec);
  const backgroundClass = _.size(backgroundStyle) ? " background" : "";
  return { style: { ...style, ...backgroundStyle }, backgroundClass };
}

function buildCellClassName(props) {
  const { columnIndex, rowIndex, allowCellEdits, gridState } = props;
  const classes = ["cell"];
  if (allowCellEdits) {
    classes.push("editable");
  }
  if (isInRange(columnIndex, rowIndex, gridState)) {
    classes.push("in-range");
  }
  return _.join(classes, " ");
}

class ReactGridCell extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.renderEdited = this.renderEdited.bind(this);
  }

  renderEdited() {
    const { key, gridState, style, rowIndex, columnIndex, propagateState } = this.props;
    const colCfg = gu.getCol(columnIndex, gridState);
    const rec = _.get(gridState, ["data", rowIndex - 1, colCfg.name], {});
    const cellStyle = _.assignIn({}, style, { padding: 0 });
    const onMouseOver = () => {
      this.props.showTooltip(this.ref.current, this.props.t("editing"));
    };
    const onMouseLeave = () => this.props.hideTooltip();
    return (
      <div ref={this.ref} className="cell" {...{ key, style: cellStyle, onMouseOver, onMouseLeave }}>
        <GridCellEditor {...{ value: rec.raw, gridState, colCfg, propagateState, rowIndex }} />
      </div>
    );
  }

  render() {
    const { columnIndex, key, rowIndex, style, gridState, editedCell, filteredRanges } = this.props;
    if (rowIndex == 0) {
      return (
        <Header
          {...gridState}
          key={key}
          columnIndex={columnIndex}
          style={style}
          propagateState={this.props.propagateState}
          openChart={this.props.openChart}
        />
      );
    }
    const colCfg = gu.getCol(columnIndex, gridState);
    const cellIdx = `${columnIndex}|${rowIndex}`;
    if (columnIndex > 0 && cellIdx === editedCell) {
      return this.renderEdited();
    }
    let value = "-";
    // wide strings need to be displayed to the left so they are easier to read
    let valueStyle = style.width > 350 && gu.isStringCol(colCfg.dtype) ? { textAlign: "left" } : {};
    const divProps = {};
    let className = buildCellClassName(this.props);
    if (colCfg.name) {
      const rec = _.get(gridState, ["data", rowIndex - 1, colCfg.name], {});
      value = rec.view;
      const styleProps = buildStyle(rec, valueStyle, { ...gridState, filteredRanges }, colCfg);
      className = `${className}${styleProps.backgroundClass}`;
      valueStyle = styleProps.style;
      if (_.includes(["string", "date"], gu.findColType(colCfg.dtype)) && rec.raw !== rec.view) {
        divProps.title = rec.raw;
      }
      divProps.cell_idx = cellIdx;
      if (_.get(gridState, ["columnFormats", colCfg.name, "fmt", "link"]) === true) {
        value = (
          <a href={rec.raw} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        );
      } else if (_.get(gridState, ["columnFormats", colCfg.name, "fmt", "html"]) === true) {
        value = <div className="html-cell" dangerouslySetInnerHTML={{ __html: value }} />;
      }
    }
    return (
      <div key={key} className={className} style={{ ...style, ...valueStyle }} {...divProps}>
        {gu.getCol(columnIndex, gridState).resized ? <div className="resized">{value}</div> : value}
      </div>
    );
  }
}
ReactGridCell.displayName = "GridCell";
ReactGridCell.propTypes = {
  columnIndex: PropTypes.number,
  rowIndex: PropTypes.number,
  key: PropTypes.string,
  style: PropTypes.object,
  gridState: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
    columnFormats: PropTypes.object,
    menuOpen: PropTypes.bool,
    rowCount: PropTypes.number,
    toggleColumnMenu: PropTypes.func,
    hideColumnMenu: PropTypes.func,
    backgroundMode: PropTypes.string,
    rangeHighlight: PropTypes.object,
    rangeSelect: PropTypes.object,
    columnRange: PropTypes.object,
    rowRange: PropTypes.object,
    selectedRow: PropTypes.number,
  }),
  propagateState: PropTypes.func,
  dataId: PropTypes.string,
  editedCell: PropTypes.string,
  allowCellEdits: PropTypes.bool,
  filteredRanges: PropTypes.object,
  openChart: PropTypes.func,
  showTooltip: PropTypes.func,
  hideTooltip: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactGridCell = withTranslation("menu_description")(ReactGridCell);
const ReduxGridCell = connect(
  state => ({
    dataId: state.dataId,
    editedCell: state.editedCell,
    allowCellEdits: state.allowCellEdits,
    filteredRanges: state.filteredRanges,
  }),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    clearEdit: () => dispatch({ type: "clear-edit" }),
    showTooltip: (element, content) => dispatch({ type: "show-menu-tooltip", element, content }),
    hideTooltip: () => dispatch({ type: "hide-menu-tooltip" }),
  })
)(TranslateReactGridCell);

export { ReduxGridCell as GridCell, TranslateReactGridCell as ReactGridCell };
