import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { openChart } from "../actions/charts";
import { buildCopyText } from "./rangeSelectUtils";

class ReactGridEventHandler extends React.Component {
  constructor(props) {
    super(props);
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleClicks = this.handleClicks.bind(this);
  }

  componentDidMount() {
    ["keyup", "keydown"].forEach(event => {
      window.addEventListener(event, e => {
        document.onselectstart = () => !(e.key == "Shift" && e.shiftKey);
      });
    });
  }

  handleMouseOver(e) {
    const { rangeSelect } = this.props.gridState;
    if (e.shiftKey && rangeSelect && rangeSelect.start) {
      const cellIdx = _.get(e, "target.attributes.cell_idx.nodeValue");
      if (cellIdx) {
        this.props.propagateState({
          rangeSelect: { ...rangeSelect, end: cellIdx },
        });
      }
    }
  }

  handleClicks(e) {
    // check for range selected
    if (e.shiftKey) {
      const cellIdx = _.get(e, "target.attributes.cell_idx.nodeValue");
      if (cellIdx) {
        const { columns, data, rangeSelect } = this.props.gridState;
        if (rangeSelect) {
          const copyText = buildCopyText(data, columns, rangeSelect.start, cellIdx);
          const title = "Copy Range to Clipboard?";
          this.props.openChart({
            ...copyText,
            type: "copy-range",
            title,
            size: "modal-sm",
            ...this.props,
          });
        } else {
          this.props.propagateState({ rangeSelect: { start: cellIdx } });
        }
      }
      return;
    }

    if (this.clickTimeout === null) {
      this.clickTimeout = setTimeout(() => {
        clearTimeout(this.clickTimeout);
        this.clickTimeout = null;
      }, 2000);
    } else {
      const cellIdx = _.get(e, "target.attributes.cell_idx.nodeValue");
      if (cellIdx) {
        this.props.editCell(cellIdx);
      }
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }
    this.props.propagateState({ rangeSelect: null });
  }

  render() {
    return (
      <div
        className="h-100 w-100"
        onMouseOver={this.handleMouseOver}
        {...(this.props.allowCellEdits ? { onClick: this.handleClicks } : {})}>
        {this.props.children}
      </div>
    );
  }
}
ReactGridEventHandler.displayName = "ReactGridEventHandler";
ReactGridEventHandler.propTypes = {
  gridState: PropTypes.shape({
    rangeSelect: PropTypes.object,
    columns: PropTypes.arrayOf(PropTypes.object),
    data: PropTypes.object,
  }),
  propagateState: PropTypes.func,
  children: PropTypes.node,
  allowCellEdits: PropTypes.bool,
  openChart: PropTypes.func,
  editCell: PropTypes.func,
};

const ReduxGridEventHandler = connect(
  ({ allowCellEdits }) => ({ allowCellEdits }),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    editCell: editedCell => dispatch({ type: "edit-cell", editedCell }),
  })
)(ReactGridEventHandler);

export { ReduxGridEventHandler as GridEventHandler, ReactGridEventHandler };
