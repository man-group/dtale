import _ from "lodash";
import numeral from "numeral";
import PropTypes from "prop-types";
import React from "react";

import corrUtils from "./correlationsUtils";

const MAX_LABEL_LEN = 20;

class CorrelationsCell extends React.Component {
  render() {
    const { columnIndex, rowIndex, style, correlations, hasDate, selectedDate } = this.props;
    if (rowIndex == 0) {
      if (columnIndex == 0) {
        return null;
      }
      const header = correlations[columnIndex - 1].column;
      const props = _.size(header) >= MAX_LABEL_LEN ? { title: header } : {};
      return (
        <div className="headerCell" style={_.assignIn(style, { fontSize: "10px" })} {...props}>
          <div>{_.truncate(header, { length: MAX_LABEL_LEN })}</div>
        </div>
      );
    }
    const row = correlations[rowIndex - 1];
    if (columnIndex == 0) {
      const props = _.size(row.column) >= MAX_LABEL_LEN ? { title: row.column } : {};
      return (
        <div className="headerCell" style={_.assignIn(style, { fontSize: "10px" })} {...props}>
          {_.truncate(row.column, { length: MAX_LABEL_LEN })}
        </div>
      );
    }
    const prop = correlations[columnIndex - 1].column;
    const corrOnItself = row.column === prop || _.isNull(row[prop]);
    const valueStyle = {
      background: corrOnItself ? "rgba(255,255,255,1)" : corrUtils.colorScale(row[prop]),
      textAlign: "center",
    };
    const props = {};
    if (!corrOnItself) {
      if (hasDate) {
        props.onClick = () => this.props.buildTs([row.column, prop], selectedDate);
      } else {
        props.onClick = () => this.props.buildScatter([row.column, prop]);
      }
      valueStyle.cursor = "pointer";
    }
    return (
      <div className="cell" style={_.assignIn(style, valueStyle)} {...props}>
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
  hasDate: PropTypes.bool,
  selectedDate: PropTypes.string,
  buildTs: PropTypes.func,
  buildScatter: PropTypes.func,
};

export default CorrelationsCell;
