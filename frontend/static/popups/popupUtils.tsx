import { TFunction } from 'i18next';
import * as React from 'react';

import { DataViewerPropagateState } from '../dtale/DataViewerState';
import { ColumnAnalysisPopupData, CreateColumnPopupData, Popups } from '../redux/state/AppState';

import About from './About';
import ColumnAnalysis from './analysis/ColumnAnalysis';
import { CodeExport } from './CodeExport';
import Confirmation from './Confirmation';
import { CopyRangeToClipboard } from './CopyRangeToClipboard';
import { Correlations } from './correlations/Correlations';
import CreateColumn from './create/CreateColumn';
import { CleaningConfig, CreateColumnType, SaveAs, TypeConversionConfig } from './create/CreateColumnState';
import Duplicates from './duplicates/Duplicates';
import { Error } from './ErrorPopup';
import FilterPopup from './filter/FilterPopup';
import Instances from './instances/Instances';
import PredictivePowerScore from './pps/PredictivePowerScore';
import RangeHighlight from './RangeHighlight';
import Rename from './Rename';
import { CreateReplacement } from './replacement/CreateReplacement';
import Reshape from './reshape/Reshape';
import { Upload } from './upload/Upload';
import { Variance } from './variance/Variance';
import XArrayDimensions from './XArrayDimensions';
import XArrayIndexes from './XArrayIndexes';

/** Popup builder inputs */
interface BuilderInput {
  propagateState: DataViewerPropagateState;
  mergeRefresher: () => Promise<void>;
  chartData: Popups;
  dataId: string;
  t: TFunction;
}

/** Popup builder output */
interface BuilderOutput {
  title?: JSX.Element;
  body?: JSX.Element;
}

const buildFilter = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="fa fa-filter" />
      <strong>{props.t('filter:Custom Filter')}</strong>
    </React.Fragment>
  );
  const body = <FilterPopup />;
  return { title, body };
};

const buildColumnAnalysis = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-equalizer" />
      {props.t(' Column Analysis for ', { ns: 'popup' })}
      <strong>{(props.chartData as ColumnAnalysisPopupData).selectedCol}</strong>
      <div id="describe" />
    </React.Fragment>
  );
  const body = <ColumnAnalysis />;
  return { title, body };
};

const buildCorrelations = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-bubble-chart" />
      <strong>{props.chartData.title}</strong>
    </React.Fragment>
  );
  const body = <Correlations />;
  return { title, body };
};

const buildPps = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-bubble-chart" />
      <strong>{props.t('Predictive Power Score', { ns: 'menu' })}</strong>
    </React.Fragment>
  );
  const body = <PredictivePowerScore />;
  return { title, body };
};

const buildCreateColumn = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-build" />
      <strong>{props.t('Dataframe Functions', { ns: 'menu' })}</strong>
    </React.Fragment>
  );
  const body = <CreateColumn />;
  return { title, body };
};

const buildTypeConversion = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-build" />
      {props.t(' Type Conversion of ', { ns: 'popup' })}
      <strong>{(props.chartData as CreateColumnPopupData).selectedCol}</strong>
    </React.Fragment>
  );
  const body = (
    <CreateColumn
      prePopulated={{
        type: CreateColumnType.TYPE_CONVERSION,
        saveAs: SaveAs.INPLACE,
        cfg: { col: (props.chartData as CreateColumnPopupData).selectedCol } as TypeConversionConfig,
      }}
    />
  );
  return { title, body };
};

const buildCleaners = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-build" />
      {props.t(' Clean ', { ns: 'popup' })}
      <strong>{(props.chartData as CreateColumnPopupData).selectedCol}</strong>
    </React.Fragment>
  );
  const body = (
    <CreateColumn
      prePopulated={{
        type: CreateColumnType.CLEANING,
        cfg: { col: (props.chartData as CreateColumnPopupData).selectedCol, cleaners: [] } as CleaningConfig,
      }}
    />
  );
  return { title, body };
};

const buildReshape = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="fas fa-tools" />
      <strong>{props.t('Summarize Data', { ns: 'menu' })}</strong>
    </React.Fragment>
  );
  const body = <Reshape />;
  return { title, body };
};

const buildAbout = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="fa fa-info-circle la-lg" />
      <strong>{props.t('About')}</strong>
    </React.Fragment>
  );
  const body = <About />;
  return { title, body };
};

const buildConfirm = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-check-circle" />
      <strong>{props.t('Yes/No', { ns: 'popup' })}</strong>
      <small className="pl-3">({props.chartData.title})</small>
    </React.Fragment>
  );
  const body = <Confirmation />;
  return { title, body };
};

const buildCopyRange = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="fas fa-clipboard" />
      <strong>{props.t('Yes/No', { ns: 'popup' })}</strong>
      <small className="pl-3">({props.chartData.title})</small>
    </React.Fragment>
  );
  const body = <CopyRangeToClipboard propagateState={props.propagateState} />;
  return { title, body };
};

const buildRange = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-flag" />
      <strong>{props.t('Range Highlights', { ns: 'menu' })}</strong>
    </React.Fragment>
  );
  const body = <RangeHighlight {...props} />;
  return { title, body };
};

const xarrayDimensions = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-key" />
      <strong>{props.t('XArray Dimensions', { ns: 'menu' })}</strong>
    </React.Fragment>
  );
  const body = <XArrayDimensions {...props} />;
  return { title, body };
};

const xarrayIndexes = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-tune" />
      <strong>{props.t('Convert To XArray', { ns: 'menu' })}</strong>
    </React.Fragment>
  );
  const body = <XArrayIndexes {...props} />;
  return { title, body };
};

const buildRename = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-edit" />
      <strong>{props.t('column_menu:Rename')}</strong>
    </React.Fragment>
  );
  const body = <Rename {...props} />;
  return { title, body };
};

const buildReplacement = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="fas fa-backspace" />
      {props.t(' Replacements for ', { ns: 'popup' })}
      <strong>{(props.chartData as CreateColumnPopupData).selectedCol}</strong>
    </React.Fragment>
  );
  const body = <CreateReplacement {...props} />;
  return { title, body };
};

const buildError = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-cancel" />
      <strong>{props.t('popup:Error')}</strong>
    </React.Fragment>
  );
  const body = <Error />;
  return { title, body };
};

const buildInstances = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-apps" />
      <strong>{props.t('Active D-Tale Instances', { ns: 'popup' })}</strong>
    </React.Fragment>
  );
  const body = <Instances />;
  return { title, body };
};

const buildCode = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-code" />
      <strong>{props.t('Code Export', { ns: 'menu' })}</strong>
    </React.Fragment>
  );
  const body = <CodeExport />;
  return { title, body };
};

const buildVariance = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="fas fa-chart-bar" />
      {`${props.t(' Variance Report for ', { ns: 'popup' })}"`}
      <strong>{(props.chartData as any).selectedCol}</strong>
      {`"`}
    </React.Fragment>
  );
  const body = <Variance {...props} />;
  return { title, body };
};

const buildUpload = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-file-upload" />
      <strong>{props.t('Load Data', { ns: 'menu' })}</strong>
    </React.Fragment>
  );
  const body = <Upload {...props} />;
  return { title, body };
};

const buildDuplicates = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="fas fa-clone" />
      <strong>{props.t('Duplicates', { ns: 'menu' })}</strong>
    </React.Fragment>
  );
  const body = <Duplicates />;
  return { title, body };
};

const POPUP_MAP = {
  filter: buildFilter,
  'column-analysis': buildColumnAnalysis,
  correlations: buildCorrelations,
  pps: buildPps,
  build: buildCreateColumn,
  'type-conversion': buildTypeConversion,
  cleaners: buildCleaners,
  reshape: buildReshape,
  about: buildAbout,
  confirm: buildConfirm,
  'copy-range': buildCopyRange,
  'copy-column-range': buildCopyRange,
  'copy-row-range': buildCopyRange,
  range: buildRange,
  'xarray-dimensions': xarrayDimensions,
  'xarray-indexes': xarrayIndexes,
  rename: buildRename,
  replacement: buildReplacement,
  error: buildError,
  instances: buildInstances,
  code: buildCode,
  variance: buildVariance,
  upload: buildUpload,
  duplicates: buildDuplicates,
};

export const buildBodyAndTitle = (props: BuilderInput): BuilderOutput =>
  (POPUP_MAP as any)[props.chartData.type]?.(props) ?? {};
