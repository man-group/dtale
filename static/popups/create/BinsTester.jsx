import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { BouncerWrapper } from "../../BouncerWrapper";
import { buildURLString } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import ColumnAnalysisChart from "../analysis/ColumnAnalysisChart";

class ReactBinsTester extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: false, data: null };
  }

  componentDidUpdate(prevProps) {
    if (_.isEqual(this.props.cfg, prevProps.cfg)) {
      return;
    }
    if (this.props.valid) {
      this.setState({ loading: true });
      const createParams = {
        type: "bins",
        cfg: JSON.stringify(this.props.cfg),
      };
      fetchJson(buildURLString(`/dtale/bins-tester/${this.props.dataId}?`, createParams), data => {
        if (data.error) {
          this.setState({ data: null, loading: false });
        } else {
          this.setState({ data, loading: false });
        }
      });
    }
    this.setState({ data: null });
  }

  render() {
    if (this.state.data === null) {
      return null;
    }
    return (
      <BouncerWrapper showBouncer={this.state.loading}>
        <ColumnAnalysisChart fetchedChartData={this.state.data} height={185} finalParams={{ type: "histogram" }} />
      </BouncerWrapper>
    );
  }
}
ReactBinsTester.displayName = "BinsTester";
ReactBinsTester.propTypes = {
  cfg: PropTypes.object,
  valid: PropTypes.bool,
  dataId: PropTypes.string,
};
ReactBinsTester.defaultProps = { valid: false };

const ReduxBinsTester = connect(({ dataId }) => ({ dataId }))(ReactBinsTester);
export { ReactBinsTester, ReduxBinsTester as BinsTester };
