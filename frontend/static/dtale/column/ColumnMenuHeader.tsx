import * as React from 'react';

import * as bu from '../backgroundUtils';
import { ColumnDef } from '../DataViewerState';

export const calcInfoMsg = (calc: string, msg?: string): string =>
  msg
    ? `<span class="pl-3 pr-3">(${msg})</span><a class="ico-info pointer" target="_blank" href="/dtale/calculation/${calc}"/>`
    : '';

const CalcInfo: React.FC<{ msg: string; calc: string }> = ({ msg, calc }) => {
  return (
    <React.Fragment>
      <span className={'pl-3 pr-3'}>{`(${msg})`}</span>
      <i
        className="ico-info pointer"
        onClick={() => {
          window.open(`/dtale/calculation/${calc}`, '_blank', 'titlebar=1,location=1,status=1,width=800,height=600');
        }}
      />
    </React.Fragment>
  );
};

export const skewMsgText = (skew?: string | number): string | undefined => {
  const skewFloat = parseFloat(`${skew}`);
  if (skewFloat || skewFloat === 0) {
    if (skewFloat >= -0.5 && skewFloat <= 0.5) {
      return 'fairly symmetrical';
    } else if ((skewFloat >= -1 && skewFloat < -0.5) || (skewFloat <= 1 && skewFloat > 0.5)) {
      return 'moderately skewed';
    } else {
      // skewFloat < -1 || skewFloat > 1
      return 'highly skewed';
    }
  }
  return undefined;
};

export const SkewMsg: React.FC<{ skew: string | number }> = ({ skew }) => {
  const msg = skewMsgText(skew);
  return msg ? <CalcInfo {...{ msg, calc: 'skew' }} /> : null;
};

export const kurtMsgText = (kurt?: string | number): string | undefined => {
  const kurtFloat = parseFloat(`${kurt}`);
  if (kurtFloat || kurtFloat === 0) {
    if (kurtFloat > 3) {
      return 'leptokurtic';
    } else if (kurtFloat === 3) {
      return 'mesokurtic';
    } else {
      // kurtFloat < 3
      return 'platykurtic';
    }
  }
  return undefined;
};

export const KurtMsg: React.FC<{ kurt: string | number }> = ({ kurt }) => {
  const msg = kurtMsgText(kurt);
  return msg ? <CalcInfo {...{ msg, calc: 'kurtosis' }} /> : null;
};

/** Component properties of ColumnMenuHeader */
interface ColumnMenuHeaderProps {
  col: string;
  colCfg: ColumnDef;
}

export const ColumnMenuHeader: React.FC<ColumnMenuHeaderProps> = ({ col, colCfg }) => (
  <header>
    <span>{`Column "${col}"`}</span>
    <ul className="col-menu-descriptors">
      <li>
        {'Data Type:'}
        <span>{colCfg.dtype}</span>
      </li>
      {!!colCfg.hasMissing && (
        <li>
          {'# Missing:'}
          <span>{colCfg.hasMissing}</span>
        </li>
      )}
      {!!colCfg.hasOutliers && (
        <li>
          {'# Outliers:'}
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
            <SkewMsg skew={colCfg.skew} />
          </span>
        </li>
      )}
      {colCfg.kurt !== undefined && (
        <li>
          Kurtosis:
          <span>
            {colCfg.kurt}
            <KurtMsg kurt={colCfg.kurt} />
          </span>
        </li>
      )}
    </ul>
  </header>
);
