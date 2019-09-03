import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import corrUtils from "./correlationsUtils";

class CorrelationScatterStats extends React.Component {
  render() {
    const [col0, col1] = this.props.selectedCols;
    const stats = this.props.stats || {};
    if (_.isEmpty(stats)) {
      return null;
    }
    const { pearson, spearman, correlated } = stats;
    let i = 0;
    const pearsonInfo = [<dt key={i++}>Pearson</dt>, <dd key={i++}>{corrUtils.percent(pearson)}</dd>];
    const spearmanInfo = [<dt key={i++}>Spearman</dt>, <dd key={i++}>{corrUtils.percent(spearman)}</dd>];
    return (
      <div className="pt-5">
        <dl className="property-pair inline">
          <dt>
            <b>{`${col0} vs. ${col1}${this.props.date ? ` for ${this.props.date}` : ""}`}</b>
          </dt>
        </dl>
        <dl className="property-pair inline">{pearsonInfo}</dl>
        <dl className="property-pair inline">{spearmanInfo}</dl>
        <dl className="property-pair inline">
          <dt>Correlated</dt>
          <dd>{correlated}</dd>
        </dl>
        <dl className="property-pair inline">
          <dt>{`Only in ${col0}`}</dt>
          <dd>{stats.only_in_s0}</dd>
        </dl>
        <dl className="property-pair inline">
          <dt>{`Only in ${col1}`}</dt>
          <dd>{stats.only_in_s1}</dd>
        </dl>
      </div>
    );
  }
}
CorrelationScatterStats.displayName = "CorrelationScatterStats";
CorrelationScatterStats.propTypes = {
  selectedCols: PropTypes.arrayOf(PropTypes.string),
  date: PropTypes.string,
  stats: PropTypes.shape({
    pearson: PropTypes.number,
    spearman: PropTypes.number,
    correlated: PropTypes.number,
    only_in_s0: PropTypes.number,
    only_in_s1: PropTypes.number,
  }),
};

export default CorrelationScatterStats;
