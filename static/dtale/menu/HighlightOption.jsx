import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class HighlightOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { label, current, mode, open, t } = this.props;
    return (
      <MenuItem description={t(`menu_description:highlight_${mode}`)} onClick={open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <div style={{ display: "inherit" }}>
              <div className={`bg-icon ${mode}-bg${current === mode ? " spin" : ""}`} />
              <span className="font-weight-bold pl-4">{t(`Highlight ${label}`, { ns: "menu" })}</span>
            </div>
          </button>
        </span>
      </MenuItem>
    );
  }
}
HighlightOption.displayName = "HighlightOption";
HighlightOption.propTypes = {
  open: PropTypes.func,
  mode: PropTypes.string,
  label: PropTypes.string,
  current: PropTypes.string,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(HighlightOption);
