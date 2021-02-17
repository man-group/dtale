import React from "react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import Collapsible from "../Collapsible";
import { fetchJson } from "../fetcher";
import { buildURLString } from "../actions/url-utils";
import { RemovableError } from "../RemovableError";
import { BouncerWrapper } from "../BouncerWrapper";
import _ from "lodash";

const LABELS = {
  node_ct: "Node Count",
  triangle_ct: "Triangle Count",
  most_connected_node: "Most Connected Node",
  leaf_ct: "Leaf Count",
  edge_ct: "Edge Count",
  max_edge: "Max Edge Weight",
  min_edge: "Min Edge Weight",
  avg_weight: "Average Edge Weight",
};

function buildStat(t, key, value) {
  if (value !== undefined) {
    return (
      <div>
        <h4 className="d-inline pr-5">{`${t(_.get(LABELS, key, key))}:`}</h4>
        <span className="d-inline">{value === undefined ? "N/A" : value}</span>
      </div>
    );
  }
  return null;
}

function buildParams({ to, from, weight }) {
  return {
    to: to?.value,
    from: from?.value,
    weight: weight?.value,
  };
}

class ReactNetworkAnalysis extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: false, analysis: null };
    this.loadAnalysis = this.loadAnalysis.bind(this);
    this.renderAnalysis = this.renderAnalysis.bind(this);
  }

  loadAnalysis() {
    const params = buildParams(this.props);
    if (!this.state.analysis || !_.isEqual(_.pick(this.state.analysis, ["to", "from", "weight"]), params)) {
      this.setState({ loading: true });
      fetchJson(buildURLString(`/dtale/network-analysis/${this.props.dataId}?`, params), data => {
        if (data.error) {
          this.setState({ loading: false, error: <RemovableError {...data} /> });
          return;
        }
        const analysis = { ...data.data, ...params };
        this.setState({ loading: false, analysis, error: null });
      });
    }
  }

  renderAnalysis() {
    const { t } = this.props;
    return (
      <BouncerWrapper showBouncer={this.state.loading}>
        {this.state.error}
        {this.state.analysis && (
          <div className="row pt-3 pb-3">
            {_.map(LABELS, (_, key) => (
              <div key={key} className="col-md-6 network-analysis">
                <ul>
                  <li>{buildStat(t, key, this.state.analysis[key])}</li>
                </ul>
              </div>
            ))}
          </div>
        )}
      </BouncerWrapper>
    );
  }

  render() {
    const { t } = this.props;
    const title = (
      <React.Fragment>
        {t("Network Analysis ")}
        <small>({t("expand to load")})</small>
      </React.Fragment>
    );
    return (
      <div className="row pb-5">
        <div className="col-md-12">
          <Collapsible title={title} content={this.renderAnalysis()} onExpand={this.loadAnalysis} />
        </div>
      </div>
    );
  }
}
ReactNetworkAnalysis.displayName = "ReactNetworkAnalysis";
ReactNetworkAnalysis.propTypes = {
  to: PropTypes.object,
  from: PropTypes.object,
  weight: PropTypes.object,
  dataId: PropTypes.string,
  t: PropTypes.func,
};
const TranslateReactNetworkAnalysis = withTranslation("network")(ReactNetworkAnalysis);
const ReduxNetworkAnalysis = connect(({ dataId }) => ({ dataId }))(TranslateReactNetworkAnalysis);
export { ReduxNetworkAnalysis as NetworkAnalysis, TranslateReactNetworkAnalysis as ReactNetworkAnalysis };
