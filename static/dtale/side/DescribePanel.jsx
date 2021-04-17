import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { buildURLString, dtypesUrl } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import ColumnNavigation from "../../popups/describe/ColumnNavigation";
import { Details } from "../../popups/describe/Details";
import menuFuncs from "../menu/dataViewerMenuUtils";

class ReactDescribePanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loadingDtypes: true, dtypeLoad: null };
  }

  componentDidUpdate(prevProps) {
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
    if (!this.props.visible || this.props.view !== "describe") {
      return null;
    }
    const { column, dataId, hideSidePanel, t } = this.props;
    const openTab = () => {
      hideSidePanel();
      window.open(
        buildURLString(menuFuncs.fullPath("/dtale/popup/describe", dataId), {
          selectedCol: column,
        }),
        "_blank"
      );
    };
    const propagateState = state => this.setState(state);
    return (
      <BouncerWrapper showBouncer={this.state.loadingDtypes}>
        <ColumnNavigation {...{ ...this.state, propagateState }} />
        <Details
          selected={this.state.selected}
          dataId={dataId}
          dtypes={this.state.dtypes}
          close={
            <>
              <div className="col-auto pr-0 mb-auto mt-auto">
                <button className="btn btn-plain" onClick={openTab}>
                  <i className="ico-open-in-new pointer" />
                  <span className="align-middle">{t("side:Open In New Tab")}</span>
                </button>
              </div>
              <div className="col-auto mb-auto mt-auto">
                <button className="btn btn-plain" onClick={hideSidePanel}>
                  <i className="ico-close pointer" />
                  <span className="align-middle">{t("side:Close")}</span>
                </button>
              </div>
            </>
          }
        />
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
  t: PropTypes.func,
};
const TranslateDescribePanel = withTranslation(["side"])(ReactDescribePanel);
const ReduxDescribePanel = connect(
  state => ({ ...state.sidePanel, dataId: state.dataId }),
  dispatch => ({ hideSidePanel: () => dispatch({ type: "hide-side-panel" }) })
)(TranslateDescribePanel);
export { ReduxDescribePanel as DescribePanel, TranslateDescribePanel as ReactDescribePanel };
