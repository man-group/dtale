import _ from "lodash";
import React from "react";

import { kurtMsg, skewMsg } from "../../dtale/column/ColumnMenuHeader";

export const COUNT_STATS = ["count", "missing_ct", "missing_pct"];
export const POSITION_STATS = ["first", "last", "top"];
export const LABELS = {
  total_count: "Total Rows",
  count: "Count (non-nan)",
  missing_ct: "Count (missing)",
  missing_pct: "% Missing",
  freq: "Frequency",
  kurt: "Kurtosis",
  skew: "Skew",
  top: "Most Frequent",
  unique: "Unique",
};

export function buildStat(t, key, value) {
  if (value !== undefined) {
    return (
      <div>
        <h4 className="d-inline pr-5">{`${t(_.get(LABELS, key, key))}:`}</h4>
        <span className="d-inline">
          {value}
          {key === "skew" && skewMsg(value)}
          {key === "kurt" && kurtMsg(value)}
        </span>
      </div>
    );
  }
  return null;
}
