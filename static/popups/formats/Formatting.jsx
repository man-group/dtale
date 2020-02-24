import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { Modal, ModalClose, ModalFooter, ModalHeader, ModalTitle } from "react-modal-bootstrap";

import { buildURLString } from "../../actions/url-utils";
import * as gu from "../../dtale/gridUtils";
import { fetchJsonPromise, logException } from "../../fetcher";
import DateFormatting from "./DateFormatting";
import NumericFormatting from "./NumericFormatting";
import StringFormatting from "./StringFormatting";

const BASE_STATE = { fmt: "", style: null };

class Formatting extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.assign({}, BASE_STATE);
    this.save = this.save.bind(this);
    this.renderBody = this.renderBody.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible && !prevProps.visible) {
      this.setState(BASE_STATE);
    }
  }

  save() {
    const { fmt, style } = this.state;
    const { dataId, data, columns, columnFormats, selectedCol, propagateState } = this.props;
    const updatedColumnFormats = _.assignIn({}, columnFormats, {
      [selectedCol]: { fmt, style },
    });
    const updatedData = _.mapValues(data, d => {
      const colCfg = _.find(columns, { name: selectedCol }, {});
      const raw = _.get(d, [selectedCol, "raw"]);
      const updatedProp = gu.buildDataProps(colCfg, raw, {
        columnFormats: { [selectedCol]: { fmt, style } },
      });
      return _.assignIn({}, d, { [selectedCol]: updatedProp });
    });
    const updatedCols = _.map(columns, c => {
      if (selectedCol === c.name) {
        return _.assignIn({}, c, {
          width: gu.calcColWidth(c, _.assignIn({}, this.state, { data: updatedData })),
        });
      }
      return c;
    });
    const updateParams = {
      settings: JSON.stringify({ formats: updatedColumnFormats }),
    };
    propagateState({
      data: updatedData,
      columnFormats: updatedColumnFormats,
      columns: updatedCols,
      formattingOpen: false,
      triggerResize: true,
      formattingUpdate: true,
    });
    fetchJsonPromise(buildURLString(`/dtale/update-settings/${dataId}?`, updateParams))
      .then(_.noop)
      .catch((e, callstack) => {
        logException(e, callstack);
      });
  }

  renderBody() {
    if (!this.props.visible) {
      return null;
    }
    const { columns, selectedCol } = this.props;
    const updateState = state => this.setState(state);
    switch (gu.findColType(_.get(_.find(columns, { name: selectedCol }), "dtype"))) {
      case "int":
      case "float":
        return <NumericFormatting {...this.props} updateState={updateState} />;
      case "date":
        return <DateFormatting {...this.props} updateState={updateState} />;
      case "string":
      case "unknown":
      default:
        return <StringFormatting {...this.props} updateState={updateState} />;
    }
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
