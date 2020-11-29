import PropTypes from "prop-types";
import React from "react";

import bu from "../backgroundUtils";

class ColumnMenuHeader extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { colCfg, col } = this.props;
    return (
      <header>
        <span>{`Column "${col}"`}</span>
        <ul className="col-menu-descriptors">
          <li>
            {"Data Type:"}
            <span>{colCfg.dtype}</span>
          </li>
          {colCfg.hasMissing > 0 && (
            <li>
              {"# Missing:"}
              <span>{colCfg.hasMissing}</span>
            </li>
          )}
          {colCfg.hasOutliers > 0 && (
            <li>
              {"# Outliers:"}
              <span>{colCfg.hasOutliers}</span>
            </li>
          )}
          {colCfg.lowVariance && (
            <li>
              {`${bu.flagIcon}Low Variance:`}
              <span>True</span>
            </li>
          )}
        </ul>
      </header>
    );
  }
}
ColumnMenuHeader.displayName = "ColumnMenuHeader";
ColumnMenuHeader.propTypes = {
  colCfg: PropTypes.object,
  col: PropTypes.string,
};

export default ColumnMenuHeader;
