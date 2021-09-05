import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { varianceUrl } from "../../actions/url-utils";
import * as gu from "../../dtale/gridUtils";
import { fetchJson } from "../../fetcher";
import { renderCodePopupAnchor } from "../CodePopup";
import { FilterableToggle } from "../FilterableToggle";
import VarianceChart from "./VarianceChart";

class Variance extends React.Component {
  constructor(props) {
    super(props);
    const hasFilters = gu.noFilters(props.settings);
    this.state = {
      loadingVariance: true,
      varianceData: null,
      hasFilters: !hasFilters,
      filtered: !hasFilters,
    };
    this.renderCheck2 = this.renderCheck2.bind(this);
    this.loadVariance = this.loadVariance.bind(this);
  }

  loadVariance() {
    const column = _.get(this.props, "chartData.selectedCol");
    fetchJson(varianceUrl(this.props.dataId, column, this.state.filtered), varianceData => {
      const newState = {
        error: null,
        loadingVariance: false,
      };
      if (varianceData.error) {
        this.setState({ error: <RemovableError {...varianceData} /> });
        return;
      }
      newState.varianceData = varianceData;
      this.setState(newState);
    });
  }

  componentDidMount() {
    this.loadVariance();
  }

  componentDidUpdate(_prevProps, prevState) {
    if (this.state.filtered !== prevState.filtered) {
      this.loadVariance();
    }
  }

  renderCheck2() {
    const { t } = this.props;
    const { varianceData } = this.state;
    const { check2 } = varianceData;
    if (!check2) {
      return <li>{t("Check 2")}: N/A</li>;
    }
    const val1 = check2.val1.val;
    const val2 = check2.val2.val;
    const check2Msg = t(`Count of most common value / Count of second most common value > 20`);
    const check2Ratio = _.round(check2.val1.ct / check2.val2.ct, 2);
    return (
      <React.Fragment>
        <li>
          <span className="mr-3">{`${t("Check 2")}: ${check2Msg} =>`}</span>
          <b>{check2.result + ""}</b>
        </li>
        <ul>
          <li>
            <span className="mr-3">{`${t("Count of most common")} "${val1}":`}</span>
            <b>{check2.val1.ct}</b>
          </li>
          <li>
            <span className="mr-3">{`${t("Count of second most common")} "${val2}":`}</span>
            <b>{check2.val2.ct}</b>
          </li>
          <li>
            <span className="mr-3">{t("Ratio")}:</span>
            <b>{check2Ratio}</b>
          </li>
        </ul>
      </React.Fragment>
    );
  }

  render() {
    const { t } = this.props;
    if (this.state.error) {
      return (
        <div key="body" className="modal-body">
          {this.state.error}
        </div>
      );
    }
    const column = _.get(this.props, "chartData.selectedCol");
    const { varianceData } = this.state;
    if (!varianceData) {
      return null;
    }
    const { code, check1, check2, size, outlierCt, missingCt, jarqueBera, shapiroWilk } = varianceData;
    const check1Pct = _.round(100 * (check1.unique / check1.size), 2);
    const check1Msg = `${t("Check 1")}: ${t("Count of unique values in a feature / sample size < 10%")}`;
    const check2res = _.get(check2, "result", false);
    const lowVariance = check1.result && check2res;
    const header = [
      t("Based on checks 1 & 2"),
      `"${column}"`,
      lowVariance ? t("has") : t("does not have"),
      t("Low Variance"),
    ].join(" ");
    return (
      <div key="body" className="modal-body describe-body">
        <BouncerWrapper showBouncer={this.state.loadingVariance}>
          <div className="row">
            <div className="col">
              <h1>{header}</h1>
            </div>
            <FilterableToggle {...this.state} propagateState={state => this.setState(state)} />
          </div>
          <ul>
            <li>
              <span className="mr-3">{`${check1Msg} =>`}</span>
              <b>{check1.result + ""}</b>
            </li>
            <ul>
              <li>
                <span className="mr-3">{t("Unique Values")}:</span>
                <b>{check1.unique}</b>
              </li>
              <li>
                <span className="mr-3">{t("Sample Size")}:</span>
                <b>{check1.size}</b>
              </li>
              <li>
                <span className="mr-3">{t("Percentage")}:</span>
                <b>{check1Pct}%</b>
              </li>
            </ul>
            {this.renderCheck2()}
            <li>
              <span className="mr-3">{t("Percentage Missing")}:</span>
              <b>{_.round(100 * (missingCt / size), 2)}%</b>
            </li>
            <li>
              <span className="mr-3">{t("Percentage Outliers")}:</span>
              <b>{_.round(100 * (outlierCt / size), 2)}%</b>
            </li>
            <li>{t("Jarque-Bera")}</li>
            <ul>
              <li>
                {t("Statistic")}: <b>{_.round(jarqueBera.statistic, 2)}</b>
              </li>
              <li>
                {t("P-value")}: <b>{_.round(jarqueBera.pvalue, 2)}</b>
              </li>
            </ul>
            <li>{t("Shapiro-Wilk")}</li>
            <ul>
              <li>
                {t("Statistic")}: <b>{_.round(shapiroWilk.statistic, 2)}</b>
              </li>
              <li>
                {t("P-value")}: <b>{_.round(shapiroWilk.pvalue, 2)}</b>
              </li>
            </ul>
          </ul>
          <div
            style={{
              position: "absolute",
              right: 25,
              top: 60,
            }}>
            {renderCodePopupAnchor(code, t("Variance"))}
          </div>
          <div
            style={{
              position: "absolute",
              width: "50%",
              height: 325,
              right: 25,
              bottom: 0,
            }}>
            <VarianceChart {...this.props} filtered={this.state.filtered} height={275} />
          </div>
        </BouncerWrapper>
      </div>
    );
  }
}
Variance.displayName = "Variance";
Variance.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    selectedCol: PropTypes.string,
  }),
  t: PropTypes.func,
  settings: PropTypes.object,
};
const TranslateVariance = withTranslation("variance")(Variance);
const ReduxVariance = connect(({ dataId, settings }) => ({ dataId, settings }))(TranslateVariance);

export { ReduxVariance as Variance, TranslateVariance as ReactVariance };
