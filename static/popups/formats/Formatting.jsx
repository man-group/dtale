import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { Modal, ModalClose, ModalFooter, ModalHeader, ModalTitle } from "react-modal-bootstrap";
import Select, { createFilter } from "react-select";

import { exports as gu } from "../../dtale/gridUtils";
import serverState from "../../dtale/serverStateManagement";
import DateFormatting from "./DateFormatting";
import NumericFormatting from "./NumericFormatting";
import StringFormatting from "./StringFormatting";

const BASE_STATE = {
  fmt: "",
  style: null,
  applyToAll: false,
  nanDisplay: { value: "nan" },
};

function buildState({ selectedCol, columnFormats, nanDisplay }) {
  let state = _.assign({}, BASE_STATE);
  if (_.has(columnFormats, selectedCol)) {
    state = _.assignIn(state, columnFormats[selectedCol]);
  }
  state.nanDisplay = { value: nanDisplay === undefined ? "nan" : nanDisplay };
  return state;
}

class Formatting extends React.Component {
  constructor(props) {
    super(props);
    this.state = buildState(props);
    this.save = this.save.bind(this);
    this.renderBody = this.renderBody.bind(this);
    this.renderApplyAll = this.renderApplyAll.bind(this);
    this.renderNanDisplay = this.renderNanDisplay.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible && !prevProps.visible) {
      this.setState(buildState(this.props));
    }
  }

  save() {
    const { fmt, style, applyToAll, nanDisplay } = this.state;
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
      nanDisplay: this.state.nanDisplay.value,
      columns: updatedCols,
      formattingOpen: false,
      triggerResize: true,
      formattingUpdate: true,
    });
    let callback = _.noop;
    if (this.props.nanDisplay !== this.state.nanDisplay.value) {
      callback = () => propagateState({ refresh: true });
    }
    serverState.updateFormats(dataId, selectedCol, { fmt, style }, applyToAll, nanDisplay.value, callback);
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

  renderNanDisplay() {
    return (
      <div className="form-group row">
        <label className="col-md-4 col-form-label text-right">
          <span>{`Display "nan" values as`}</span>
        </label>
        <div className="col-md-6">
          <Select
            className="Select is-searchable Select--single"
            classNamePrefix="Select"
            options={_.map(["nan", "-", ""], o => ({ value: o }))}
            getOptionLabel={_.property("value")}
            getOptionValue={_.property("value")}
            value={this.state.nanDisplay}
            onChange={nanDisplay => this.setState({ nanDisplay })}
            filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
          />
        </div>
      </div>
    );
  }

  render() {
    const { visible } = this.props;
    const hide = () => this.props.propagateState({ formattingOpen: false });
    return (
      <Modal isOpen={visible} onRequestHide={hide} backdrop={false}>
        {visible && <GlobalHotKeys keyMap={{ CLOSE_MODAL: "esc" }} handlers={{ CLOSE_MODAL: hide }} />}
        <ModalHeader>
          <ModalTitle>
            <i className="ico-palette" />
            Formatting
          </ModalTitle>
          <ModalClose onClick={hide} />
        </ModalHeader>
        {this.renderBody()}
        {this.renderApplyAll()}
        {this.renderNanDisplay()}
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
  nanDisplay: PropTypes.string,
  selectedCol: PropTypes.string,
  visible: PropTypes.bool,
  propagateState: PropTypes.func,
};

export default Formatting;
