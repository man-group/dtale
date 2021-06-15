import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { renderCodePopupAnchor } from "../CodePopup";

class CorrelationsTsOptions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      window: props.window,
      minPeriods: props.minPeriods,
      useRolling: props.useRolling,
    };
    this.changeDate = this.changeDate.bind(this);
    this.renderDescription = this.renderDescription.bind(this);
    this.renderRollingWindow = this.renderRollingWindow.bind(this);
    this.renderDateDropdown = this.renderDateDropdown.bind(this);
    this.changeDate = this.changeDate.bind(this);
  }

  changeDate(evt) {
    const rolling = _.get(_.find(this.props.dates, { name: evt.target.value }, {}), "rolling", false);
    const { useRolling } = this.state;
    const { window, minPeriods } = this.props;
    this.props.buildTs(this.props.selectedCols, evt.target.value, rolling, useRolling, window, minPeriods);
  }

  renderDescription() {
    const { selectedCols, rolling, window, t } = this.props;
    let description = `${t("Timeseries of Pearson Correlation for")} ${selectedCols[0]} ${t("vs.")} ${selectedCols[1]}`;
    if (rolling) {
      description =
        `${t("Rolling Pearson Correlation (window")}: ${window})${t(" for ")}${selectedCols[0]}` +
        `${t("vs.")} ${selectedCols[1]}`;
    }
    let clicker = t("Click on any point in the chart to view a scatter plot of the data in that correlation");
    if (rolling) {
      clicker = t("Click on any point in the chart to view a scatter plot of the data in that rolling correlation");
    }
    return (
      <div className="col pl-0 pr-0">
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
    const updateWindowAndMinPeriods = e => {
      if (e.key === "Enter") {
        let { window, minPeriods } = this.state;
        window = window && parseInt(window) ? parseInt(window) : null;
        minPeriods = minPeriods && parseInt(minPeriods) ? parseInt(minPeriods) : null;
        if (window !== null || minPeriods !== null) {
          const { buildTs, selectedCols, selectedDate, rolling } = this.props;
          const { useRolling } = this.state;
          buildTs(selectedCols, selectedDate, rolling, useRolling, window, minPeriods);
        }
      }
    };
    const updateUseRolling = () => {
      const { buildTs, selectedCols, selectedDate, rolling, window, minPeriods } = this.props;
      const { useRolling } = this.state;
      this.setState(
        { useRolling: !useRolling },
        buildTs(selectedCols, selectedDate, rolling, !useRolling, window, minPeriods)
      );
    };
    const { useRolling } = this.state;
    const { rolling, t } = this.props;
    return (
      <React.Fragment>
        {!rolling && (
          <React.Fragment>
            <div className="col text-center pr-0">
              <div>
                <b>{t("Use Rolling?")}</b>
              </div>
              <div style={{ marginTop: "-.5em" }}>
                <small>{t("(Rolling Mean)")}</small>
              </div>
            </div>
            <div style={{ marginTop: ".3em" }}>
              <i className={`ico-check-box${useRolling ? "" : "-outline-blank"} pointer`} onClick={updateUseRolling} />
            </div>
          </React.Fragment>
        )}
        <div className="col text-center">
          <div>
            <b>
              {t("Rolling")}
              <br />
              {t("Window")}
            </b>
          </div>
          <div style={{ marginTop: "-.5em" }}>
            <small>{t("(Please edit)")}</small>
          </div>
        </div>
        <div style={{ width: "3em" }} data-tip={t("Press ENTER to submit")}>
          <input
            type="text"
            className="form-control text-center"
            value={this.state.window}
            onChange={e => this.setState({ window: e.target.value })}
            onKeyDown={updateWindowAndMinPeriods}
            disabled={!rolling && !useRolling}
          />
        </div>
        <div className="col text-center">
          <div>
            <b>{t("Min Periods")}</b>
          </div>
          <div style={{ marginTop: "-.5em" }}>
            <small>{t("(Please edit)")}</small>
          </div>
        </div>
        <div style={{ width: "3em" }} data-tip={t("Press ENTER to submit")}>
          <input
            type="text"
            className="form-control text-center"
            value={this.state.minPeriods}
            onChange={e => this.setState({ minPeriods: e.target.value })}
            onKeyDown={updateWindowAndMinPeriods}
            disabled={!rolling && !useRolling}
          />
        </div>
      </React.Fragment>
    );
  }

  renderDateDropdown() {
    const { dates, selectedDate, t } = this.props;
    return [
      <label key="date-label" className="col-form-label text-right">
        {t("Date Column")}
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
    const { hasDate, selectedCols, t } = this.props;
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
            {this.renderRollingWindow()}
          </div>
        </div>
        <div className="col-auto pl-0 pr-0 text-right" style={{ marginTop: ".3em" }}>
          {renderCodePopupAnchor(this.props.tsCode, t("Correlations Timeseries"))}
        </div>
      </div>
    );
  }
}
CorrelationsTsOptions.displayName = "CorrelationsTsOptions";
CorrelationsTsOptions.propTypes = {
  hasDate: PropTypes.bool,
  rolling: PropTypes.bool,
  useRolling: PropTypes.bool,
  dates: PropTypes.arrayOf(PropTypes.object),
  selectedCols: PropTypes.arrayOf(PropTypes.string),
  selectedDate: PropTypes.string,
  window: PropTypes.number,
  minPeriods: PropTypes.number,
  buildTs: PropTypes.func,
  tsCode: PropTypes.string,
  t: PropTypes.func,
};

export default withTranslation("correlations")(CorrelationsTsOptions);
