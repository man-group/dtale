import _ from "lodash";
import numeral from "numeral";
import PropTypes from "prop-types";
import React from "react";
import { Modal, ModalBody, ModalClose, ModalFooter, ModalHeader, ModalTitle } from "react-modal-bootstrap";

import { buildURLString } from "../actions/url-utils";
import { fetchJsonPromise, logException } from "../fetcher";
import { buildStyling } from "./dataViewerMenuUtils";
import * as gu from "./gridUtils";

const STYLE_PROPS = ["redNegs"];

function buildFormatter(fmt = { precision: 2 }) {
  const { precision, thousands, abbreviate, exponent, bps } = fmt;
  let fmtStr = "0";
  if (thousands) {
    fmtStr = "0,000";
  }
  if (precision) {
    fmtStr += `.${_.repeat(0, precision)}`;
  }
  if (abbreviate) {
    fmtStr += "a";
  }
  if (exponent) {
    fmtStr += "e+0";
  }
  if (bps) {
    fmtStr += "BPS";
  }
  return { fmt: fmtStr, style: _.pick(fmt, STYLE_PROPS) };
}

const BASE_STATE = {
  precision: null,
  thousands: false,
  abbreviate: false,
  exponent: false,
  bps: false,
  redNegs: false,
  fmt: "",
};

class Formatting extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.assign({}, BASE_STATE);
    this.updateState = this.updateState.bind(this);
    this.buildSimpleToggle = this.buildSimpleToggle.bind(this);
    this.save = this.save.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible && !prevProps.visible) {
      this.setState(BASE_STATE);
    }
  }

  updateState(state) {
    const updatedState = _.assignIn({}, this.state, state);
    this.setState(_.assignIn(updatedState, buildFormatter(updatedState)));
  }

  buildSimpleToggle(prop, label) {
    return (
      <div className="form-group row">
        <label className="col-md-4 col-form-label text-right">{label}</label>
        <div className="col-md-6">
          <div className="btn-group">
            {_.map([true, false], (val, i) => {
              const buttonProps = { className: "btn" };
              if (val === this.state[prop]) {
                buttonProps.className += " btn-primary active";
              } else {
                buttonProps.className += " btn-primary inactive";
                buttonProps.onClick = () => this.updateState({ [prop]: val });
              }
              return (
                <button key={i} {...buttonProps}>
                  {val ? "On" : "Off"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  save() {
    const { fmt, style } = this.state;
    const { data, columns, numberFormats, selectedCols, propagateState } = this.props;
    const updatedNumberFormats = _.assignIn(
      {},
      numberFormats,
      _.reduce(selectedCols, (res, col) => _.assignIn(res, { [col]: { fmt, style } }), {})
    );
    const updatedData = _.mapValues(data, d =>
      _.assignIn(
        {},
        d,
        _.mapValues(_.pick(d, selectedCols), (v, k) => {
          const colCfg = _.find(columns, { name: k }, {});
          return gu.buildDataProps(colCfg, v.raw, {
            numberFormats: { [colCfg.name]: { fmt, style } },
          });
        })
      )
    );
    const updatedCols = _.map(columns, c => {
      if (_.includes(selectedCols, c.name)) {
        return _.assignIn({}, c, {
          width: gu.calcColWidth(c, _.assignIn({}, this.state, { data: updatedData })),
        });
      }
      return c;
    });
    const updateParams = {
      settings: JSON.stringify({ formats: updatedNumberFormats }),
    };
    propagateState({
      data: updatedData,
      numberFormats: updatedNumberFormats,
      columns: updatedCols,
      formattingOpen: false,
      triggerResize: true,
    });
    fetchJsonPromise(buildURLString("/dtale/update-settings?", updateParams))
      .then(_.noop)
      .catch((e, callstack) => {
        logException(e, callstack);
      });
  }

  render() {
    if (!this.props.visible) {
      return null;
    }
    const hide = () => this.props.propagateState({ formattingOpen: false });
    const exampleNum = -123456.789;
    let exampleOutput = this.state.fmt ? numeral(exampleNum).format(this.state.fmt) : exampleNum;
    exampleOutput = <span style={buildStyling(exampleNum, "float", this.state)}>{exampleOutput}</span>;
    return (
      <Modal isOpen={this.props.visible} onRequestHide={hide} backdrop={false}>
        <ModalHeader>
          <ModalTitle>
            <i className="ico-palette" />
            Formatting
          </ModalTitle>
          <ModalClose onClick={hide} />
        </ModalHeader>
        <ModalBody>
          <div className="form-group row">
            <label className="col-md-4 col-form-label text-right">Precision</label>
            <div className="col-md-6">
              <div className="btn-group">
                {_.map(_.range(7), precision => {
                  const buttonProps = { className: "btn" };
                  if (precision === this.state.precision) {
                    buttonProps.className += " btn-primary active";
                  } else {
                    buttonProps.className += " btn-primary inactive";
                    buttonProps.onClick = () => this.updateState({ precision });
                  }
                  return (
                    <button key={precision} {...buttonProps}>
                      {precision}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {this.buildSimpleToggle("thousands", "Thousands Separator")}
          {this.buildSimpleToggle("abbreviate", "Abbreviate")}
          {this.buildSimpleToggle("exponent", "Exponent")}
          {this.buildSimpleToggle("bps", "BPS")}
          {this.buildSimpleToggle("redNegs", "Red Negatives")}
          <div className="form-group row">
            <label className="col-md-4 col-form-label text-right">
              <span>Numeral.js Format</span>
              <i
                style={{ cursor: "help" }}
                className="ico-info-outline pl-5"
                onClick={e => {
                  e.preventDefault();
                  window.open(
                    "http://numeraljs.com/#format",
                    null,
                    "titlebar=1,location=1,status=1,width=990,height=450"
                  );
                }}
              />
            </label>
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                value={this.state.fmt}
                onChange={event => this.setState({ fmt: event.target.value })}
              />
            </div>
          </div>
          <div className="row text-center">
            <small className="col-md-10">
              {`EX: ${exampleNum} => `}
              {exampleOutput}
            </small>
          </div>
        </ModalBody>
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
  data: PropTypes.object,
  columns: PropTypes.arrayOf(PropTypes.object),
  numberFormats: PropTypes.object,
  selectedCols: PropTypes.arrayOf(PropTypes.string),
  visible: PropTypes.bool,
  propagateState: PropTypes.func,
};

export default Formatting;
