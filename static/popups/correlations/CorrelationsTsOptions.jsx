import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { renderCodePopupAnchor } from "../CodePopup";

class CorrelationsTsOptions extends React.Component {
  constructor(props) {
    super(props);
    this.state = { window: props.window };
    this.changeDate = this.changeDate.bind(this);
    this.renderDescription = this.renderDescription.bind(this);
    this.renderRollingWindow = this.renderRollingWindow.bind(this);
    this.renderDateDropdown = this.renderDateDropdown.bind(this);
    this.changeDate = this.changeDate.bind(this);
  }

  changeDate(evt) {
    const rolling = _.get(_.find(this.props.dates, { name: evt.target.value }, {}), "rolling", false);
    this.props.buildTs(this.props.selectedCols, evt.target.value, rolling, rolling ? this.state.window : null);
  }

  renderDescription() {
    const { selectedCols, rolling, window } = this.props;
    let description = `Timeseries of Pearson Correlation for ${selectedCols[0]} vs. ${selectedCols[1]}`;
    if (rolling) {
      description = `Rolling Pearson Correlation (window: ${window}) for ${selectedCols[0]} vs. ${selectedCols[1]}`;
    }
    let clicker = "Click on any point in the chart to view a scatter plot of the data in that correlation";
    if (rolling) {
      clicker = "Click on any point in the chart to view a scatter plot of the data in that rolling correlation";
    }
    return (
      <div className="col">
        <div>
          <b>{description}</b>
        </div>
        <div style={{ marginTop: "-.5em" }}>
          <small>{`(${clicker})`}</small>
        </div>
      </div>
    );
  }

  renderRollingWindow() {
    const updateWindow = e => {
      if (e.key === "Enter") {
        if (this.state.window && parseInt(this.state.window)) {
          const { selectedCols, selectedDate, rolling } = this.props;
          this.props.buildTs(selectedCols, selectedDate, rolling, parseInt(this.state.window));
        }
      }
    };
    return [
      <div key="rolling-label" className="col text-right">
        <div>
          <b>Rolling Window</b>
        </div>
        <div style={{ marginTop: "-.5em" }}>
          <small>(Please edit)</small>
        </div>
      </div>,
      <div key="rolling-input" style={{ width: "3em" }} data-tip="Press ENTER to submit">
        <input
          type="text"
          className="form-control text-center"
          value={this.state.window}
          onChange={e => this.setState({ window: e.target.value })}
          onKeyPress={updateWindow}
        />
      </div>,
    ];
  }

  renderDateDropdown() {
    const { dates, selectedDate } = this.props;
    return [
      <label key="date-label" className="col-form-label text-right">
        Date Column
      </label>,
      <div key="date-input">
        <select className="form-control custom-select" defaultValue={selectedDate} onChange={this.changeDate}>
          {_.map(dates, d => (
            <option key={d.name}>{d.name}</option>
          ))}
        </select>
      </div>,
    ];
  }

  render() {
    const { hasDate, selectedCols } = this.props;
    if (!hasDate) {
      return null;
    }
    if (_.isEmpty(selectedCols)) {
      return null;
    }
    return (
      <div className="row pt-5">
        {this.renderDescription()}
        <div className="col-auto">
          <div className="form-group row small-gutters float-right pr-3">
            {_.size(this.props.dates) > 1 && this.renderDateDropdown()}
            {this.props.rolling && this.renderRollingWindow()}
          </div>
        </div>
        <div className="col-auto pl-0 text-right">
          {renderCodePopupAnchor(this.props.tsCode, "Correlations Timeseries")}
        </div>
      </div>
    );
  }
}
CorrelationsTsOptions.displayName = "CorrelationsTsOptions";
CorrelationsTsOptions.propTypes = {
  hasDate: PropTypes.bool,
  rolling: PropTypes.bool,
  dates: PropTypes.arrayOf(PropTypes.object),
  selectedCols: PropTypes.arrayOf(PropTypes.string),
  selectedDate: PropTypes.string,
  window: PropTypes.number,
  buildTs: PropTypes.func,
  tsCode: PropTypes.string,
};

export default CorrelationsTsOptions;
