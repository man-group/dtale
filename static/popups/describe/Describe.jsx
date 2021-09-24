import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { updateSettings } from "../../actions/settings";
import { dtypesUrl } from "../../actions/url-utils";
import serverState from "../../dtale/serverStateManagement";
import { fetchJson } from "../../fetcher";
import ColumnNavigation from "./ColumnNavigation";
import { Details } from "./Details";
import DtypesGrid from "./DtypesGrid";

class Describe extends React.Component {
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
        let selectedRow = _.find(dtypesData.dtypes, {
          name: this.props.chartData.selectedCol,
        });
        if (_.isUndefined(selectedRow)) {
          selectedRow = _.head(dtypesData.dtypes);
        }
        newState.dtypes = _.map(newState.dtypes, d => _.assign(d, { selected: d.name == selectedRow.name }));
        newState.selected = selectedRow; // by default, display first column
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
      const callback = () => {
        window.opener.location.reload();
        window.close();
      };
      serverState.updateVisibility(this.props.dataId, visibility, callback);
    };
    const propagateState = state => this.setState(state);
    return [
      <div key="body" className="modal-body describe-body">
        <ColumnNavigation {...{ ...this.state, propagateState }} />
        <div className="row">
          <div className="col-md-5 describe-dtypes-grid-col">
            <BouncerWrapper showBouncer={this.state.loadingDtypes}>
              <DtypesGrid ref={mg => (this._grid = mg)} dtypes={this.state.dtypes} propagateState={propagateState} />
            </BouncerWrapper>
          </div>
          <div className="col-md-7 describe-details-col">
            <Details
              selected={this.state.selected}
              dataId={this.props.dataId}
              dtypes={this.state.dtypes}
              updateSettings={this.props.updateSettings}
            />
          </div>
        </div>
      </div>,
      <div key="footer" className="modal-footer">
        <button className="btn btn-primary" onClick={save}>
          <span>{this.props.t("Update Grid")}</span>
        </button>
      </div>,
    ];
  }
}
Describe.displayName = "Describe";
Describe.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    selectedCol: PropTypes.string,
  }),
  updateSettings: PropTypes.func,
  t: PropTypes.func,
};
const TranslateDescribe = withTranslation("describe")(Describe);
const ReduxDescribe = connect(
  ({ settings }) => ({ settings }),
  dispatch => ({
    updateSettings: settings => dispatch(updateSettings(settings)),
  })
)(TranslateDescribe);
export { ReduxDescribe as Describe, TranslateDescribe as ReactDescribe };
