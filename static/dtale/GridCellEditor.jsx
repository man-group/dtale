import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { openChart } from "../actions/charts";
import { onKeyDown } from "./edited/editUtils";

class ReactGridCellEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: props.value || "" };
    this.input = React.createRef();
    this.onKeyDown = this.onKeyDown.bind(this);
    this.escapeHandler = this.escapeHandler.bind(this);
  }

  escapeHandler(event) {
    if (event.key === "Escape") {
      this.props.clearEdit();
    }
  }

  componentDidMount() {
    this.input.current?.focus();
    window.addEventListener("keydown", this.escapeHandler);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.escapeHandler);
  }

  onKeyDown(e) {
    const { colCfg, rowIndex } = this.props;
    onKeyDown(e, colCfg, rowIndex, this.state.value, this.props.value, this.props);
  }

  render() {
    return (
      <input
        ref={this.input}
        style={{ background: "lightblue", width: "inherit" }}
        type="text"
        value={this.state.value}
        onChange={e => this.setState({ value: e.target.value })}
        onKeyDown={this.onKeyDown}
      />
    );
  }
}
ReactGridCellEditor.propTypes = {
  value: PropTypes.node,
  colCfg: PropTypes.object,
  rowIndex: PropTypes.number,
  propagateState: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  openChart: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  clearEdit: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  dataId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  gridState: PropTypes.shape({
    data: PropTypes.object,
    columns: PropTypes.arrayOf(PropTypes.object),
    sortInfo: PropTypes.arrayOf(PropTypes.array),
    columnFormats: PropTypes.object,
  }),
  settings: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  maxColumnWidth: PropTypes.number, // eslint-disable-line react/no-unused-prop-types
};
const ReduxGridCellEditor = connect(
  ({ dataId, editedCell, settings, maxColumnWidth }) => ({
    dataId,
    editedCell,
    settings,
    maxColumnWidth,
  }),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    clearEdit: () => dispatch({ type: "clear-edit" }),
  })
)(ReactGridCellEditor);

export { ReactGridCellEditor, ReduxGridCellEditor as GridCellEditor };
