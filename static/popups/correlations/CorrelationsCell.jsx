import _ from "lodash";
import numeral from "numeral";
import PropTypes from "prop-types";
import React from "react";

import { SORT_CHARS } from "../../dtale/Header";

const MAX_LABEL_LEN = 18;

class CorrelationsCell extends React.Component {
  constructor(props) {
    super(props);
    this.renderHeader = this.renderHeader.bind(this);
  }

  renderHeader(title, sortable = false) {
    const { style, currSort, updateSort } = this.props;
    const props = _.size(title) >= MAX_LABEL_LEN ? { title } : {};
    const className = `headerCell${sortable ? " pointer" : ""}`;
    return (
      <div
        className={className}
        style={_.assignIn(style, { fontSize: "10px" })}
        {...props}
        onClick={sortable ? () => updateSort(title) : _.noop}>
        <div>
          {sortable && currSort && currSort[0] == title && _.get(SORT_CHARS, currSort[1])}
          {_.truncate(title, { length: MAX_LABEL_LEN })}
        </div>
      </div>
    );
  }

  render() {
    const { columnIndex, rowIndex, style, correlations, columns, col2, hasDate, selectedDate, colorScale } = this.props;
    if (rowIndex == 0) {
      if (columnIndex == 0) {
        return null;
      }
      return this.renderHeader(_.isNull(col2) ? columns[columnIndex - 1].value : col2.value, true);
    }
    const row = correlations[rowIndex - 1];
    if (columnIndex == 0) {
      return this.renderHeader(row.column);
    }
    const prop = _.isNull(col2) ? columns[columnIndex - 1].value : col2.value;
    const corrOnItself = row.column === prop || _.isNull(row[prop]);
    const valueStyle = {
      background: corrOnItself ? "rgba(255,255,255,1)" : colorScale(row[prop]),
      textAlign: "center",
    };
    const props = {};
    if (!corrOnItself) {
      if (hasDate) {
        props.onClick = () =>
          this.props.buildTs(
            [row.column, prop],
            selectedDate,
            this.props.rolling,
            this.props.useRolling,
            this.props.window,
            this.props.minPeriods
          );
      } else {
        props.onClick = () => this.props.buildScatter([row.column, prop]);
      }
      valueStyle.cursor = "pointer";
    }
    if (_.get(this.props.selectedCols, "0") === row.column && _.get(this.props.selectedCols, "1") === prop) {
      valueStyle.paddingTop = ".2em";
      return (
        <div className="cell d-inline" style={_.assignIn({}, style, valueStyle)} {...props}>
          <i className="ico-show-chart float-left" />
          <span style={{ marginLeft: "-1em" }}>{corrOnItself ? "N/A" : numeral(row[prop]).format("0.00")}</span>
        </div>
      );
    }
    return (
      <div className="cell" style={_.assignIn({}, style, valueStyle)} {...props}>
        {corrOnItself ? "N/A" : numeral(row[prop]).format("0.00")}
      </div>
    );
  }
}
CorrelationsCell.displayName = "CorrelationsCell";
CorrelationsCell.propTypes = {
  columnIndex: PropTypes.number,
  rowIndex: PropTypes.number,
  style: PropTypes.object,
  correlations: PropTypes.array,
  columns: PropTypes.array,
  hasDate: PropTypes.bool,
  selectedDate: PropTypes.string,
  buildTs: PropTypes.func,
  buildScatter: PropTypes.func,
  col2: PropTypes.object,
  rolling: PropTypes.bool,
  useRolling: PropTypes.bool,
  window: PropTypes.number,
  minPeriods: PropTypes.number,
  selectedCols: PropTypes.arrayOf(PropTypes.string),
  colorScale: PropTypes.func,
  currSort: PropTypes.array,
  updateSort: PropTypes.func,
};

export default CorrelationsCell;
