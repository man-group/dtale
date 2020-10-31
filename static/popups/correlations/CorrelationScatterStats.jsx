import _ from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";

import { renderCodePopupAnchor } from "../CodePopup";
import corrUtils from "./correlationsUtils";

class CorrelationScatterStats extends React.Component {
  constructor(props) {
    super(props);
    this.renderDescription = this.renderDescription.bind(this);
  }

  renderDescription() {
    const [col0, col1] = this.props.selectedCols;
    let dateStr = this.props.date ? ` for ${this.props.date}` : "";
    if (this.props.rolling) {
      const startDate = moment(this.props.date)
        .subtract(this.props.window - 1, "days")
        .format("YYYY-MM-DD");
      dateStr = ` for ${startDate} thru ${this.props.date}`;
    }
    return <b>{`${col0} vs. ${col1}${dateStr}`}</b>;
  }

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
    return [
      <div key={0} className="pt-5">
        <dl className="property-pair inline">
          <dt>{this.renderDescription()}</dt>
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
        <dl className="property-pair inline float-right">
          {renderCodePopupAnchor(this.props.scatterCode, "Correlations Scatter")}
        </dl>
      </div>,
      <div key={1} style={{ marginTop: "-.5em" }}>
        <small>(Click on any point in the scatter to filter the grid down to that record)</small>
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
  rolling: PropTypes.bool,
  window: PropTypes.number,
  scatterCode: PropTypes.string,
};

export default CorrelationScatterStats;
