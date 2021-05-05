import _ from "lodash";
import * as gu from "../../dtale/gridUtils";

const s = col => `df['${col}']`;
const standardConv = (col, to) => `${s(col)}.astype('${to}')`;

function buildMixedCode(col, to) {
  if (to === "float") {
    return `pd.to_numeric(${s(col)}, errors="coerce")`;
  } else if (to === "bool") {
    return [
      "import numpy as np",
      "bool_map = dict(true=True, false=False)",
      `${s(col)}.apply(lambda b: bool_map.get(str(b).lower(), np.nan)`,
    ];
  }
  return standardConv(col, to);
}

function buildStringCode(col, to, fmt) {
  // date, int, float, bool, category
  if (to === "date") {
    const kwargs = fmt ? `format='${fmt}'` : "infer_datetime_format=True";
    return `pd.to_datetime(${s(col)}, ${kwargs})`;
  } else if (to === "int") {
    return [
      `s = ${s(col)}`,
      "if s.str.startswith('0x').any():",
      "\tstr_data = s.apply(lambda v: v if pd.isnull(v) else int(v, base=16))",
      "else:",
      "\tstr_data = s.astype('float').astype('int')",
    ];
  } else if (to === "float") {
    return [
      `s = ${s(col)}`,
      "if s.str.startswith('0x').any():",
      "\tstr_data = s.apply(float.fromhex)",
      "else:",
      "\tstr_data = pd.to_numeric(s, errors='coerce')",
    ];
  }
  return standardConv(col, to);
}

function buildIntCode(col, to, unit) {
  // date, float, category, str, bool
  if (to === "date") {
    if (unit === "YYYYMMDD") {
      return `${s(col)}.astype(str).apply(pd.Timestamp)`;
    } else {
      return `pd.to_datetime(${s(col)}, unit='${unit || "D"}')`;
    }
  } else if (to === "hex") {
    return `${s(col)}.apply(lambda v: v if pd.isnull(v) else hex(v))`;
  }
  return standardConv(col, to);
}

function buildDateCode(col, to, fmt, unit) {
  // str, int
  if (to === "int") {
    if (unit === "YYYYMMDD") {
      return `pd.Series(${s(col)}.dt.strftime('%Y%m%d').astype(int)`;
    }
    return ["import time", `${s(col)}.apply(lambda x: time.mktime(x.timetuple())).astype(int)`];
  }
  return `pd.Series(${s(col)}.dt.strftime('${fmt}')`;
}

export default function buildCode({ col, from, to, fmt, unit }) {
  if (_.isNull(col) || _.isNull(to)) {
    return null;
  }
  const classifier = gu.findColType(from);
  if (classifier === "string") {
    return buildStringCode(col, to, fmt);
  } else if (classifier === "int") {
    return buildIntCode(col, to, unit);
  } else if (classifier === "date") {
    return buildDateCode(col, to, fmt, unit);
  } else if (_.includes(["float", "bool"], classifier)) {
    if (to === "hex") {
      return `${s(col)}.apply(float.hex)`;
    }
    return standardConv(col, to);
  } else if (_.startsWith(from, "mixed")) {
    return buildMixedCode(col, to);
  }
  return null;
}
