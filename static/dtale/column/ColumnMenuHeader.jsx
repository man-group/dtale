import PropTypes from "prop-types";
import React from "react";

import bu from "../backgroundUtils";

export function skewMsg(skew) {
  const skewFloat = parseFloat(skew);
  if (skewFloat || skewFloat === 0) {
    if (skewFloat >= -0.5 && skewFloat < 0.5) {
      return " (fairly symmetrical)";
    } else if (skewFloat >= -1 && skewFloat < -0.5) {
      return " (moderately skewed)";
    } else if (skewFloat < -1 || skewFloat > 1) {
      return " (highly skewed)";
    }
  }
  return "";
}

export function kurtMsg(kurt) {
  const kurtFloat = parseFloat(kurt);
  if (kurtFloat || kurtFloat === 0) {
    if (kurtFloat > 3) {
      return " (leptokurtic)";
    } else if (kurtFloat === 3) {
      return " (mesokurtic)";
    } else if (kurtFloat < 3) {
      return " (platykurtic)";
    }
  }
  return "";
}

export default class ColumnMenuHeader extends React.Component {
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
          {colCfg.skew && (
            <li>
              Skew:
              <span>
                {colCfg.skew}
                {skewMsg(colCfg.skew)}
              </span>
            </li>
          )}
          {colCfg.kurt && (
            <li>
              Kurtosis:
              <span>
                {colCfg.kurt}
                {kurtMsg(colCfg.kurt)}
              </span>
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
