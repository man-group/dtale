import PropTypes from "prop-types";
import React from "react";

import { MenuItem } from "./MenuItem";

require("./LowVarianceOption.css");

class LowVarianceOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { toggleLowVarianceBackground, backgroundMode } = this.props;
    const iconClass = `ico-check-box${backgroundMode == "lowVariance" ? "" : "-outline-blank"}`;
    return (
      <MenuItem
        className="hoverable low-variance"
        description={
          <>
            <span>Show flags on column headers where both these conditions are true:</span>
            <ul className="low-variance-conditions">
              <li>{"Count of unique values / column size < 10%"}</li>
              <li>{"Count of most common value / Count of second most common value > 20"}</li>
            </ul>
            <span>{`You can view variance information by clicking the "Variance" option in the column menu.`}</span>
          </>
        }>
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={toggleLowVarianceBackground}>
            <i className={iconClass} style={{ marginTop: "-.25em" }} />
            <span className="font-weight-bold">Low Variance Flag</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
LowVarianceOption.displayName = "LowVarianceOption";
LowVarianceOption.propTypes = {
  backgroundMode: PropTypes.string,
  toggleLowVarianceBackground: PropTypes.func,
};

export default LowVarianceOption;
