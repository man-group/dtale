import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class ReactNewTabOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { t } = this.props;
    const iframe = global.top !== global.self;
    if (iframe) {
      return (
        <MenuItem onClick={() => window.open(window.location.pathname?.replace("/iframe/", "/main/"), "_blank")}>
          <span className="toggler-action">
            <button className="btn btn-plain">
              <i className="ico-open-in-new" />
              <span className="font-weight-bold">{t("Open In New Tab", { ns: "menu" })}</span>
            </button>
          </span>
        </MenuItem>
      );
    }
    return null;
  }
}
ReactNewTabOption.displayName = "ReactNewTabOption";
ReactNewTabOption.propTypes = {
  t: PropTypes.func,
};
export default withTranslation(["menu", "menu_description"])(ReactNewTabOption);
