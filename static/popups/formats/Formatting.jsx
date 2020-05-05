import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { Modal, ModalClose, ModalFooter, ModalHeader, ModalTitle } from "react-modal-bootstrap";

import { exports as gu } from "../../dtale/gridUtils";
import serverState from "../../dtale/serverStateManagement";
import DateFormatting from "./DateFormatting";
import NumericFormatting from "./NumericFormatting";
import StringFormatting from "./StringFormatting";

const BASE_STATE = { fmt: "", style: null, applyToAll: false };

function buildState({ selectedCol, columnFormats }) {
  let state = _.assign({}, BASE_STATE);
  if (_.has(columnFormats, selectedCol)) {
    state = _.assignIn(state, columnFormats[selectedCol]);
  }
  return state;
}

class Formatting extends React.Component {
  constructor(props) {
    super(props);
    this.state = buildState(props);
    this.save = this.save.bind(this);
    this.renderBody = this.renderBody.bind(this);
    this.renderApplyAll = this.renderApplyAll.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible && !prevProps.visible) {
      this.setState(buildState(this.props));
    }
  }

  save() {
    const { fmt, style, applyToAll } = this.state;
    const { dataId, data, columns, columnFormats, selectedCol, propagateState } = this.props;
    let selectedCols = [selectedCol];
    if (applyToAll) {
      const dtype = gu.getDtype(selectedCol, columns);
      selectedCols = _.map(_.filter(columns, { dtype }), "name");
    }
    let updatedColumnFormats = _.reduce(selectedCols, (ret, sc) => ({ ...ret, [sc]: { fmt, style } }), {});
    updatedColumnFormats = _.assignIn({}, columnFormats, updatedColumnFormats);
    const updatedData = _.mapValues(data, d => {
      const updates = _.reduce(
        selectedCols,
        (ret, sc) => {
          const colCfg = _.find(columns, { name: sc }, {});
          const raw = _.get(d, [sc, "raw"]);
          const updatedProp = gu.buildDataProps(colCfg, raw, {
            columnFormats: { [sc]: { fmt, style } },
          });
          return { ...ret, [sc]: updatedProp };
        },
        {}
      );
      return _.assignIn({}, d, updates);
    });
    const updatedCols = _.map(columns, c => {
      if (_.includes(selectedCols, c.name)) {
        return _.assignIn({}, c, {
          width: gu.calcColWidth(c, _.assignIn({}, this.state, { data: updatedData })),
        });
      }
      return c;
    });
    propagateState({
      data: updatedData,
      columnFormats: updatedColumnFormats,
      columns: updatedCols,
      formattingOpen: false,
      triggerResize: true,
      formattingUpdate: true,
    });
    serverState.updateFormats(dataId, selectedCol, { fmt, style }, applyToAll);
  }

  renderBody() {
    if (!this.props.visible) {
      return null;
    }
    const { columns, selectedCol } = this.props;
    const updateState = state => this.setState(state);
    const fmtProps = { ...this.props, updateState };
    switch (gu.findColType(gu.getDtype(selectedCol, columns))) {
      case "int":
      case "float":
        return <NumericFormatting {...fmtProps} />;
      case "date":
        return <DateFormatting {...fmtProps} />;
      case "string":
      case "unknown":
      default:
        return <StringFormatting {...fmtProps} />;
    }
  }

  renderApplyAll() {
    const { columns, selectedCol } = this.props;
    return (
      <div className="row mb-0">
        <div className="col" />
        <label className="col-auto col-form-label pr-3">
          {`Apply this formatting to all columns of dtype, ${gu.getDtype(selectedCol, columns)}?`}
        </label>
        <div className="col-auto p-0">
          <i
            className={`ico-check-box${this.state.applyToAll ? "" : "-outline-blank"} pointer mt-4`}
            onClick={() =>
              this.setState({
                applyToAll: !this.state.applyToAll,
              })
            }
          />
        </div>
        <div className="col" />
      </div>
    );
  }

  render() {
    const hide = () => this.props.propagateState({ formattingOpen: false });
    return (
      <Modal isOpen={this.props.visible} onRequestHide={hide} backdrop={false}>
        <ModalHeader>
          <ModalTitle>
            <i className="ico-palette" />
            Formatting
          </ModalTitle>
          <ModalClose onClick={hide} />
        </ModalHeader>
        {this.renderBody()}
        {this.renderApplyAll()}
        <ModalFooter>
          <button className="btn btn-primary" onClick={this.save}>
            <span>Apply</span>
          </button>
        </ModalFooter>
      </Modal>
    );
  }
}
Formatting.displayName = "Formatting";
Formatting.propTypes = {
  dataId: PropTypes.string.isRequired,
  data: PropTypes.object,
  columns: PropTypes.arrayOf(PropTypes.object),
  columnFormats: PropTypes.object,
  selectedCol: PropTypes.string,
  visible: PropTypes.bool,
  propagateState: PropTypes.func,
};

export default Formatting;
