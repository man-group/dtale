import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { openChart } from "../../actions/charts";
import { getCell } from "../gridUtils";
import { onKeyDown } from "./editUtils";

require("./EditedCellInfo.scss");

function buildState(props) {
  const { editedCell, gridState } = props;
  if (editedCell === null) {
    return { value: null, rowIndex: null, colCfg: null, origValue: null };
  }
  const { rec, colCfg, rowIndex } = getCell(editedCell, gridState);
  return { value: rec.raw, rowIndex, colCfg, origValue: rec.raw };
}

class ReactEditedCellInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = buildState(props);
    this.input = React.createRef();
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.editedCell !== this.props.editedCell) {
      this.setState(buildState(this.props));
    }
    if (this.state.origValue && this.state.origValue !== prevState.origValue) {
      const ref = this.input.current;
      ref.style.height = "0px";
      ref.style.height = `${ref.scrollHeight}px`;
      ref.focus();
      this.props.updateHeight(ref.scrollHeight + 25);
    }
  }

  onKeyDown(e) {
    const { colCfg, rowIndex, value, origValue } = this.state;
    onKeyDown(e, colCfg, rowIndex, value, origValue, this.props);
  }

  render() {
    const { editedCell } = this.props;
    const { colCfg, rowIndex } = this.state;
    return (
      <div className={`row edited-cell-info${editedCell ? " is-expanded" : ""}`}>
        <div className="col-md-12 pr-3 pl-3">
          <span className="font-weight-bold pr-3">Editing Cell</span>
          <span>[Column:</span>
          <span className="font-weight-bold pl-3">{colCfg?.name}</span>
          <span>, Row:</span>
          <span className="font-weight-bold pl-3">{rowIndex - 1}</span>
          <span>]</span>
          <small className="pl-3">(Press ENTER to submit or ESC to exit)</small>
          <textarea
            ref={this.input}
            style={{ width: "inherit" }}
            value={this.state.value ?? ""}
            onChange={e => this.setState({ value: e.target.value })}
            onKeyDown={this.onKeyDown}
          />
        </div>
      </div>
    );
  }
}
ReactEditedCellInfo.displayName = "EditedCellInfo";
ReactEditedCellInfo.propTypes = {
  editedCell: PropTypes.string,
  propagateState: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  dataId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  gridState: PropTypes.shape({
    data: PropTypes.object,
    columns: PropTypes.arrayOf(PropTypes.object),
    sortInfo: PropTypes.arrayOf(PropTypes.array),
    columnFormats: PropTypes.object,
  }),
  openChart: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  clearEdit: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  settings: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  maxColumnWidth: PropTypes.number, // eslint-disable-line react/no-unused-prop-types
  updateHeight: PropTypes.func,
};
const TranslateEditedCellInfo = withTranslation("main")(ReactEditedCellInfo);
const ReduxEditedCellInfo = connect(
  ({ dataId, editedCell, settings, maxColumnWidth }) => ({
    dataId,
    editedCell,
    settings,
    maxColumnWidth,
  }),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    clearEdit: () => dispatch({ type: "clear-edit" }),
    updateHeight: height => dispatch({ type: "edited-cell-textarea-height", height }),
  })
)(TranslateEditedCellInfo);
export { ReduxEditedCellInfo as EditedCellInfo, TranslateEditedCellInfo as ReactEditedCellInfo };
