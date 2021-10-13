import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { updateSettings } from "../../actions/settings";
import serverStateManagement from "../serverStateManagement";
import { MenuItem } from "./MenuItem";

class ReactVerticalColumnHeaders extends React.Component {
  constructor(props) {
    super(props);
    this.setVerticalHeaders = this.setVerticalHeaders.bind(this);
  }

  setVerticalHeaders() {
    const { dataId, setVerticalHeaders } = this.props;
    const verticalHeaders = this.props.settings.verticalHeaders ?? false;
    const updates = { verticalHeaders: !verticalHeaders };
    const settings = { ...this.props.settings, ...updates };
    const callback = () => setVerticalHeaders(settings);
    serverStateManagement.updateSettings(updates, dataId, callback);
  }

  render() {
    const { settings, t } = this.props;
    const verticalHeaders = settings.verticalHeaders ?? false;
    const iconClass = `ico-check-box${verticalHeaders ? "" : "-outline-blank"}`;
    return (
      <MenuItem
        className="hoverable"
        description={t("menu_description:vertical_headers")}
        onClick={this.setVerticalHeaders}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className={iconClass} style={{ marginTop: "-.25em" }} />
            <span className="font-weight-bold" style={{ fontSize: "95%" }}>
              {t("Vertical Column Headers", { ns: "menu" })}
            </span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
ReactVerticalColumnHeaders.displayName = "VerticalColumnHeaders";
ReactVerticalColumnHeaders.propTypes = {
  dataId: PropTypes.string,
  settings: PropTypes.object,
  setVerticalHeaders: PropTypes.func,
  t: PropTypes.func,
};

const TranslatedVerticalColumnHeaders = withTranslation(["menu", "menu_description"])(ReactVerticalColumnHeaders);
const ReduxVerticalColumnHeaders = connect(
  ({ dataId, settings }) => ({ dataId, settings }),
  dispatch => ({
    setVerticalHeaders: settings => dispatch(updateSettings(settings, () => dispatch({ type: "hide-ribbon-menu" }))),
  })
)(TranslatedVerticalColumnHeaders);

export {
  ReduxVerticalColumnHeaders as VerticalColumnHeaders,
  TranslatedVerticalColumnHeaders as ReactVerticalColumnHeaders,
};
