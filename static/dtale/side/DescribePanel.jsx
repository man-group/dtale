import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { updateSettings } from "../../actions/settings";
import { dtypesUrl } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import ColumnNavigation from "../../popups/describe/ColumnNavigation";
import { Details } from "../../popups/describe/Details";
import DtypesGrid from "../../popups/describe/DtypesGrid";
import serverState from "../serverStateManagement";
import { SidePanelButtons } from "./SidePanelButtons";

class ReactDescribePanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loadingDtypes: true, dtypeLoad: null };
    this.grid = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (!_.includes(["describe", "show_hide"], this.props.view)) {
      return;
    }
    const propNames = ["visible", "view", "column"];
    if (_.isEqual(_.pick(this.props, propNames), _.pick(prevProps, propNames))) {
      return;
    }
    const { dtypeLoad } = this.state;
    const now = new Date();
    if (!dtypeLoad || Math.ceil(((now - dtypeLoad) / 1000) * 60) > 5) {
      this.setState({ loadingDtypes: true });
      fetchJson(dtypesUrl(this.props.dataId), dtypesData => {
        const newState = {
          error: null,
          loadingDtypes: false,
          dtypeLoad: now,
        };
        if (dtypesData.error) {
          this.setState({ error: <RemovableError {...dtypesData} /> });
          return;
        }
        newState.dtypes = dtypesData.dtypes;
        if (dtypesData.dtypes.length) {
          newState.selected = _.find(dtypesData.dtypes, {
            name: this.props.column,
          });
        }
        this.setState(newState);
      });
    } else if (this.props.column !== prevProps.column) {
      this.setState({
        selected: _.find(this.state.dtypes, { name: this.props.column }),
      });
    }
  }

  render() {
    const { visible, view } = this.props;
    if (!visible || !_.includes(["describe", "show_hide"], view)) {
      return null;
    }
    const { dataId, toggleVisible } = this.props;
    const propagateState = state => this.setState(state);
    const save = () => {
      const currDtypes = this.grid.current.state.dtypes;
      const visibility = _.reduce(currDtypes, (ret, d) => _.assignIn(ret, { [d.name]: d.visible }), {});
      serverState.updateVisibility(this.props.dataId, visibility, () => toggleVisible(visibility));
    };
    return (
      <BouncerWrapper showBouncer={this.state.loadingDtypes}>
        {view === "describe" && (
          <>
            <ColumnNavigation {...{ ...this.state, propagateState }} />
            <Details
              selected={this.state.selected}
              dataId={dataId}
              dtypes={this.state.dtypes}
              updateSettings={this.props.updateSettings}
              close={
                <>
                  <SidePanelButtons />
                  <div style={{ paddingRight: "15px" }} />
                </>
              }
            />
          </>
        )}
        {view === "show_hide" && (
          <>
            <div className="row m-0 pb-3">
              <button className="btn btn-primary col-auto pt-2 pb-2" onClick={save}>
                <span>{this.props.t("Save Visibility")}</span>
              </button>
              <div className="col" />
              <SidePanelButtons />
            </div>
            <div style={{ height: "calc(100vh - 100px)" }}>
              <DtypesGrid ref={this.grid} dtypes={this.state.dtypes} propagateState={_.noop} />
            </div>
          </>
        )}
      </BouncerWrapper>
    );
  }
}
ReactDescribePanel.displayName = "ReactDescribePanel";
ReactDescribePanel.propTypes = {
  dataId: PropTypes.string,
  visible: PropTypes.bool,
  column: PropTypes.string,
  view: PropTypes.string,
  hideSidePanel: PropTypes.func,
  toggleVisible: PropTypes.func,
  updateSettings: PropTypes.func,
  t: PropTypes.func,
};
const TranslateDescribePanel = withTranslation(["side"])(ReactDescribePanel);
const ReduxDescribePanel = connect(
  state => ({ ...state.sidePanel, dataId: state.dataId }),
  dispatch => ({
    hideSidePanel: () => dispatch({ type: "hide-side-panel" }),
    toggleVisible: columns =>
      dispatch({
        type: "data-viewer-update",
        update: { type: "toggle-columns", columns },
      }),
    updateSettings: settings => dispatch(updateSettings(settings)),
  })
)(TranslateDescribePanel);
export { ReduxDescribePanel as DescribePanel, TranslateDescribePanel as ReactDescribePanel };
