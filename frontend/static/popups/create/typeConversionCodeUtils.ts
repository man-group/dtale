import { ColumnType, findColType } from '../../dtale/gridUtils';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import { IntToBoolCfg, TypeConversionConfig } from './CreateColumnState';

export const isMixed = (colType?: string): boolean => (colType ?? '').startsWith('mixed');
const s = (col: string): string => `df['${col}']`;
const standardConv = (col: string, to: string): string => `${s(col)}.astype('${to}')`;

const buildMixedCode = (col: string, to: string): CreateColumnCodeSnippet => {
  if (to === 'float') {
    return `pd.to_numeric(${s(col)}, errors="coerce")`;
  } else if (to === 'bool') {
    return [
      'import numpy as np',
      'bool_map = dict(true=True, false=False)',
      `${s(col)}.apply(lambda b: bool_map.get(str(b).lower(), np.nan)`,
    ];
  }
  return standardConv(col, to);
};

const buildStringCode = (col: string, to: string, fmt?: string): CreateColumnCodeSnippet => {
  // date, int, float, bool, category
  if (to === 'date') {
    const kwargs = fmt ? `format='${fmt}'` : 'infer_datetime_format=True';
    return `pd.to_datetime(${s(col)}, ${kwargs})`;
  } else if (to === 'int') {
    return [
      `s = ${s(col)}`,
      "if s.str.startswith('0x').any():",
      '\tstr_data = s.apply(lambda v: v if pd.isnull(v) else int(v, base=16))',
      'else:',
      "\tstr_data = s.astype('float').astype('int')",
    ];
  } else if (to === 'float') {
    return [
      `s = ${s(col)}`,
      "if s.str.startswith('0x').any():",
      '\tstr_data = s.apply(float.fromhex)',
      'else:',
      "\tstr_data = pd.to_numeric(s, errors='coerce')",
    ];
  }
  return standardConv(col, to);
};

const buildIntCode = (col: string, to: string, unit?: string, cfg?: IntToBoolCfg): CreateColumnCodeSnippet => {
  // date, float, category, str, bool
  if (to === 'date') {
    if (unit === 'YYYYMMDD') {
      return `${s(col)}.astype(str).apply(pd.Timestamp)`;
    } else {
      return `pd.to_datetime(${s(col)}, unit='${unit || 'D'}')`;
    }
  } else if (to === 'hex') {
    return `${s(col)}.apply(lambda v: v if pd.isnull(v) else hex(v))`;
  } else if (to === 'bool') {
    const conds = [];
    if (cfg?.equals.active && cfg?.equals.value) {
      conds.push(`cond${conds.length + 1} = ${s(col)}.isin([${(cfg?.equals.value ?? '').split(',').join(',')}])`);
    }
    if (cfg?.greaterThan.active && cfg?.greaterThan.value) {
      conds.push(`cond${conds.length + 1} = (${s(col)} > ${cfg?.greaterThan.value})`);
    }
    if (cfg?.lessThan.active && cfg?.lessThan.value) {
      conds.push(`cond${conds.length + 1} = (${s(col)} < ${cfg?.lessThan.value})`);
    }
    if (!conds.length) {
      return 'False';
    }
    return [...conds, conds.map((_, i) => `cond${i + 1}`).join(' | ')];
  }
  return standardConv(col, to);
};

const buildDateCode = (col: string, to: string, fmt?: string, unit?: string): CreateColumnCodeSnippet => {
  // str, int
  if (to === 'int') {
    if (unit === 'YYYYMMDD') {
      return `pd.Series(${s(col)}.dt.strftime('%Y%m%d').astype(int)`;
    }
    return ['import time', `${s(col)}.apply(lambda x: time.mktime(x.timetuple())).astype(int)`];
  }
  return `pd.Series(${s(col)}.dt.strftime('${fmt}')`;
};

export const buildCode = (cfg: TypeConversionConfig): CreateColumnCodeSnippet => {
  if (!cfg.col || !cfg.to) {
    return undefined;
  }
  const classifier = findColType(cfg.from!);
  if (classifier === ColumnType.STRING) {
    return buildStringCode(cfg.col, cfg.to, cfg.fmt);
  } else if (classifier === ColumnType.INT) {
    return buildIntCode(cfg.col, cfg.to, cfg.unit, cfg.cfg);
  } else if (classifier === ColumnType.DATE) {
    return buildDateCode(cfg.col, cfg.to, cfg.fmt, cfg.unit);
  } else if (['float', 'bool'].includes(classifier)) {
    if (cfg.to === 'hex') {
      return `${s(cfg.col)}.apply(float.hex)`;
    }
    return standardConv(cfg.col, cfg.to);
  } else if (isMixed(cfg.from)) {
    return buildMixedCode(cfg.col, cfg.to);
  }
  return undefined;
};
