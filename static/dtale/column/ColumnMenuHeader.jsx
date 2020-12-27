import PropTypes from "prop-types";
import React from "react";

import bu from "../backgroundUtils";

function calcInfo(msg, calc, asText = false) {
  if (asText) {
    let txt = `<span class="pl-3 pr-3">(${msg})</span>`;
    txt += `<a class="ico-info pointer" target="_blank" href="/dtale/calculation/${calc}"/>`;
    return txt;
  }
  return (
    <React.Fragment>
      <span className={"pl-3 pr-3"}>{`(${msg})`}</span>
      <i
        className="ico-info pointer"
        onClick={() => {
          window.open(`/dtale/calculation/${calc}`, "_blank", "titlebar=1,location=1,status=1,width=800,height=600");
        }}
      />
    </React.Fragment>
  );
}

export function skewMsg(skew, asText = false) {
  const skewFloat = parseFloat(skew);
  if (skewFloat || skewFloat === 0) {
    let msg;
    if (skewFloat >= -0.5 && skewFloat <= 0.5) {
      msg = "fairly symmetrical";
    } else if ((skewFloat >= -1 && skewFloat < -0.5) || (skewFloat <= 1 && skewFloat > 0.5)) {
      msg = "moderately skewed";
    } else if (skewFloat < -1 || skewFloat > 1) {
      msg = "highly skewed";
    }
    return calcInfo(msg, "skew", asText);
  }
  return "";
}

export function kurtMsg(kurt, asText = false) {
  const kurtFloat = parseFloat(kurt);
  if (kurtFloat || kurtFloat === 0) {
    let msg;
    if (kurtFloat > 3) {
      msg = "leptokurtic";
    } else if (kurtFloat === 3) {
      msg = "mesokurtic";
    } else if (kurtFloat < 3) {
      msg = "platykurtic";
    }
    return calcInfo(msg, "kurtosis", asText);
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
          {colCfg.skew !== undefined && (
            <li>
              Skew:
              <span>
                {colCfg.skew}
                {skewMsg(colCfg.skew)}
              </span>
            </li>
          )}
          {colCfg.kurt !== undefined && (
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
