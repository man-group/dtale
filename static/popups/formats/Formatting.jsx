import _ from "lodash";
import PropTypes from "prop-types";
import { Resizable } from "re-resizable";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { GlobalHotKeys } from "react-hotkeys";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import Select, { createFilter } from "react-select";

import * as gu from "../../dtale/gridUtils";
import serverState from "../../dtale/serverStateManagement";
import DraggableModalDialog from "../DraggableModalDialog";
import DateFormatting from "./DateFormatting";
import NumericFormatting from "./NumericFormatting";
import StringFormatting from "./StringFormatting";

const BASE_STATE = {
  fmt: "",
  style: null,
  applyToAll: false,
  nanDisplay: { value: "nan" },
  minHeight: null,
  minWidth: null,
};

function buildState({ selectedCol, columnFormats, nanDisplay }) {
  let state = _.assign({}, BASE_STATE);
  if (_.has(columnFormats, selectedCol)) {
    state = _.assignIn(state, columnFormats[selectedCol]);
  }
  state.nanDisplay = { value: nanDisplay === undefined ? "nan" : nanDisplay };
  return state;
}

class ReactFormatting extends React.Component {
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
    const { dataId, data, columns, columnFormats, selectedCol, propagateState, settings, maxColumnWidth } = this.props;
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
            settings,
          });
          return { ...ret, [sc]: updatedProp };
        },
        {}
      );
      return _.assignIn({}, d, updates);
    });
    const updatedCols = _.map(columns, c => {
      if (_.includes(selectedCols, c.name)) {
        return {
          ...c,
          ...gu.calcColWidth(c, {
            ...this.state,
            data: updatedData,
            ...settings,
            maxColumnWidth,
          }),
        };
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
    const { columns, selectedCol, t } = this.props;
    return (
      <div className="row mb-5">
        <div className="col" />
        <label className="col-auto col-form-label pr-3">
          {`${t("Apply this formatting to all columns of dtype,")} ${gu.getDtype(selectedCol, columns)}?`}
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
    const { t } = this.props;
    return (
      <div className="form-group row">
        <label className="col-md-4 col-form-label text-right">
          <span>{t(`Display "nan" values as`)}</span>
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
    const { visible, t } = this.props;
    const hide = () => this.props.propagateState({ formattingOpen: false });
    const onResizeStart = (_e, _dir, refToElement) => {
      this.setState({
        minHeight: refToElement.offsetHeight,
        minWidth: refToElement.offsetWidth,
      });
    };
    return (
      <Modal show={visible} onHide={hide} backdrop="static" dialogAs={DraggableModalDialog}>
        {visible && <GlobalHotKeys keyMap={{ CLOSE_MODAL: "esc" }} handlers={{ CLOSE_MODAL: hide }} />}
        <Resizable
          className="modal-resizable"
          defaultSize={{ width: "auto", height: "auto" }}
          minHeight={this.state.minHeight}
          minWidth={this.state.minWidth}
          onResizeStart={onResizeStart}>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="ico-palette" />
              {t("formatting:Formatting")}
            </Modal.Title>
          </Modal.Header>
          <div style={{ paddingBottom: "5em" }}>
            {this.renderBody()}
            {this.renderApplyAll()}
            {this.renderNanDisplay()}
          </div>
          <Modal.Footer>
            <button className="btn btn-primary" onClick={this.save}>
              <span>{t("builders:Apply")}</span>
            </button>
          </Modal.Footer>
          <span className="resizable-handle" />
        </Resizable>
      </Modal>
    );
  }
}
ReactFormatting.displayName = "ReactFormatting";
ReactFormatting.propTypes = {
  dataId: PropTypes.string.isRequired,
  data: PropTypes.object,
  columns: PropTypes.arrayOf(PropTypes.object),
  columnFormats: PropTypes.object,
  nanDisplay: PropTypes.string,
  selectedCol: PropTypes.string,
  visible: PropTypes.bool,
  propagateState: PropTypes.func,
  settings: PropTypes.object,
  maxColumnWidth: PropTypes.number,
  t: PropTypes.func,
};
const TranslateReactFormatting = withTranslation(["formatting", "builders"])(ReactFormatting);
const ReduxFormatting = connect(({ dataId, settings, maxColumnWidth }) => ({
  dataId,
  settings,
  maxColumnWidth,
}))(TranslateReactFormatting);

export { ReduxFormatting as Formatting, TranslateReactFormatting as ReactFormatting };
