import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class ChartsOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={this.props.t("menu_description:charts")} onClick={this.props.open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="ico-show-chart" />
            <span className="font-weight-bold">{this.props.t("Charts", { ns: "menu" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
ChartsOption.displayName = "ChartsOption";
ChartsOption.propTypes = {
  open: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(ChartsOption);
