import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { BouncerWrapper } from "../BouncerWrapper";
import { RemovableError } from "../RemovableError";
import { closeChart } from "../actions/charts";
import { dtypesUrl } from "../actions/url-utils";
import serverState from "../dtale/serverStateManagement";
import { fetchJson } from "../fetcher";
import { Details } from "./describe/Details";
import { DtypesGrid } from "./describe/DtypesGrid";

class ReactDescribe extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingDtypes: true,
      dtypes: null,
      dtypesFilter: null,
      selected: null,
    };
  }

  componentDidMount() {
    fetchJson(dtypesUrl(this.props.dataId), dtypesData => {
      const newState = {
        error: null,
        loadingDtypes: false,
      };
      if (dtypesData.error) {
        this.setState({ error: <RemovableError {...dtypesData} /> });
        return;
      }
      newState.dtypes = dtypesData.dtypes;
      if (dtypesData.dtypes.length) {
        let selectedRow = _.find(dtypesData.dtypes, ({ name }) => name === this.props.chartData.selectedCol);
        if (_.isUndefined(selectedRow)) {
          selectedRow = _.head(dtypesData.dtypes);
        }
        newState.dtypes = _.map(newState.dtypes, d => _.assign(d, { selected: d.name == selectedRow.name }));
        newState.selected = selectedRow.name; // by default, display first column
      }
      this.setState(newState);
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div key="body" className="modal-body">
          {this.state.error}
        </div>
      );
    }
    const save = () => {
      const visibility = _.reduce(this._grid.state.dtypes, (ret, d) => _.assignIn(ret, { [d.name]: d.visible }), {});
      const vizzCallback = () => {
        if (_.startsWith(window.location.pathname, "/dtale/popup/describe")) {
          window.opener.location.reload();
        } else {
          const updatedColumns = _.map(this.props.chartData.columns, c =>
            _.assignIn({}, c, { visible: _.get(visibility, c.name, true) })
          );
          this.props.chartData.propagateState({ columns: updatedColumns }, this.props.onClose);
        }
      };
      serverState.updateVisibility(this.props.dataId, visibility, vizzCallback);
    };
    const propagateState = state => this.setState(state);
    return [
      <div key="body" className="modal-body">
        <div className="row">
          <div className="col-md-5">
            <BouncerWrapper showBouncer={this.state.loadingDtypes}>
              <DtypesGrid ref={mg => (this._grid = mg)} dtypes={this.state.dtypes} propagateState={propagateState} />
            </BouncerWrapper>
          </div>
          <div className="col-md-7">
            <Details selected={this.state.selected} dataId={this.props.dataId} propagateState={propagateState} />
          </div>
        </div>
      </div>,
      <div key="footer" className="modal-footer">
        <button className="btn btn-primary" onClick={save}>
          <span>Update Grid</span>
        </button>
      </div>,
    ];
  }
}
ReactDescribe.displayName = "ReactDescribe";
ReactDescribe.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    selectedCol: PropTypes.string,
    columns: PropTypes.arrayOf(PropTypes.object),
    propagateState: PropTypes.func,
  }),
  onClose: PropTypes.func,
};
ReactDescribe.defaultProps = { onClose: _.noop };

const ReduxDescribe = connect(
  state => _.pick(state, ["dataId", "chartData"]),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(ReactDescribe);

export { ReactDescribe, ReduxDescribe as Describe };
