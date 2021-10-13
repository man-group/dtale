import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { renderCodePopupAnchor } from "../CodePopup";
import { default as PPSDetails, displayScore } from "../pps/PPSDetails";
import corrUtils from "./correlationsUtils";

class CorrelationScatterStats extends React.Component {
  constructor(props) {
    super(props);
    this.renderDescription = this.renderDescription.bind(this);
  }

  renderDescription() {
    const { selectedCols, t } = this.props;
    const [col0, col1] = selectedCols;
    return <b>{`${col0} ${t("vs.", { ns: "correlations" })} ${col1}${this.props.date || ""}`}</b>;
  }

  render() {
    const { selectedCols, t } = this.props;
    const [col0, col1] = selectedCols;
    const stats = this.props.stats || {};
    if (_.isEmpty(stats)) {
      return null;
    }
    const { pearson, spearman, pps, correlated } = stats;
    let i = 0;
    return [
      <div key={0} className="pt-5">
        <dl className="property-pair inline">
          <dt>{this.renderDescription()}</dt>
        </dl>
        <dl className="property-pair inline">
          <dt key={i++}>{t("correlations:Pearson")}</dt>
          <dd key={i++}>{corrUtils.percent(pearson)}</dd>
        </dl>
        <dl className="property-pair inline">
          <dt key={i++}>{t("correlations:Spearman")}</dt>
          <dd key={i++}>{corrUtils.percent(spearman)}</dd>
        </dl>
        {pps && (
          <dl className="property-pair inline">
            <dt>{t("correlations:PPS")}</dt>
            <dd className="hoverable">
              {displayScore(pps)}
              <div className="hoverable__content">
                <h4>{t("Predictive Power Score", { ns: "menu" })}</h4>
                <PPSDetails ppsInfo={pps} />
              </div>
            </dd>
          </dl>
        )}
        <dl className="property-pair inline">
          <dt>{t("correlations:Correlated")}</dt>
          <dd>{correlated}</dd>
        </dl>
        <dl className="property-pair inline">
          <dt>{`${t("Only in", { ns: "correlations" })} ${col0}`}</dt>
          <dd>{stats.only_in_s0}</dd>
        </dl>
        <dl className="property-pair inline">
          <dt>{`${t("Only in", { ns: "correlations" })} ${col1}`}</dt>
          <dd>{stats.only_in_s1}</dd>
        </dl>
        <dl className="property-pair inline float-right">
          {renderCodePopupAnchor(this.props.scatterCode, t("Correlations Scatter", { ns: "correlations" }))}
        </dl>
      </div>,
      <div key={1} style={{ marginTop: "-.5em" }}>
        <small>
          {t("(Click on any point in the scatter to filter the grid down to that record)", { ns: "correlations" })}
        </small>
      </div>,
    ];
  }
}
CorrelationScatterStats.displayName = "CorrelationScatterStats";
CorrelationScatterStats.propTypes = {
  selectedCols: PropTypes.arrayOf(PropTypes.string),
  date: PropTypes.string,
  stats: PropTypes.shape({
    pearson: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    spearman: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    correlated: PropTypes.number,
    only_in_s0: PropTypes.number,
    only_in_s1: PropTypes.number,
  }),
  scatterCode: PropTypes.string,
  t: PropTypes.func,
};

export default withTranslation(["menu", "correlations"])(CorrelationScatterStats);
