import { TFunction } from 'i18next';
import * as React from 'react';

import { DataViewerPropagateState } from '../dtale/DataViewerState';
import { ColumnAnalysisPopupData, CreateColumnPopupData, Popups, PopupType } from '../redux/state/AppState';

import About from './About';
import ColumnAnalysis from './analysis/ColumnAnalysis';
import JumpToColumn from './arcticdb/JumpToColumn';
import LibrarySymbolSelector from './arcticdb/LibrarySymbolSelector';
import Confirmation from './Confirmation';
import { CopyRangeToClipboard } from './CopyRangeToClipboard';
import { Correlations } from './correlations/Correlations';
import CreateColumn from './create/CreateColumn';
import { CleaningConfig, CreateColumnType, SaveAs, TypeConversionConfig } from './create/CreateColumnState';
import Duplicates from './duplicates/Duplicates';
import { Error } from './ErrorPopup';
import Export from './Export';
import FilterPopup from './filter/FilterPopup';
import Instances from './instances/Instances';
import PredictivePowerScore from './pps/PredictivePowerScore';
import RangeHighlight from './RangeHighlight';
import Rename from './Rename';
import CreateReplacement from './replacement/CreateReplacement';
import Reshape from './reshape/Reshape';
import Upload from './upload/Upload';
import Variance from './variance/Variance';
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
  const body = <CreateColumn propagateState={props.propagateState} />;
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
      propagateState={props.propagateState}
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
      propagateState={props.propagateState}
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
  const body = <CopyRangeToClipboard />;
  return { title, body };
};

const buildRange = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="ico-flag" />
      <strong>{props.t('Range Highlights', { ns: 'menu' })}</strong>
    </React.Fragment>
  );
  const body = <RangeHighlight />;
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
  const body = <CreateReplacement />;
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

const buildExport = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="far fa-file" />
      <strong>{props.t('menu:Export')}</strong>
    </React.Fragment>
  );
  const body = <Export />;
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

const buildVariance = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="fas fa-chart-bar" />
      {`${props.t(' Variance Report for ', { ns: 'popup' })}"`}
      <strong>{(props.chartData as any).selectedCol}</strong>
      {`"`}
    </React.Fragment>
  );
  const body = <Variance />;
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

const buildArcticDB = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="fa-solid fa-database" />
      <strong>{props.t('Load ArcticDB Data', { ns: 'menu' })}</strong>
    </React.Fragment>
  );
  const body = <LibrarySymbolSelector />;
  return { title, body };
};

const buildJumpToColumn = (props: BuilderInput): BuilderOutput => {
  const title = (
    <React.Fragment>
      <i className="fa-solid fa-magnifying-glass-plus" />
      <strong>{props.t('Jump To Column', { ns: 'menu' })}</strong>
    </React.Fragment>
  );
  const body = <JumpToColumn propagateState={props.propagateState} />;
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

const POPUP_MAP: Record<PopupType, (props: BuilderInput) => BuilderOutput> = {
  [PopupType.FILTER]: buildFilter,
  [PopupType.COLUMN_ANALYSIS]: buildColumnAnalysis,
  [PopupType.CORRELATIONS]: buildCorrelations,
  [PopupType.PPS]: buildPps,
  [PopupType.BUILD]: buildCreateColumn,
  [PopupType.TYPE_CONVERSION]: buildTypeConversion,
  [PopupType.CLEANERS]: buildCleaners,
  [PopupType.RESHAPE]: buildReshape,
  [PopupType.ABOUT]: buildAbout,
  [PopupType.CONFIRM]: buildConfirm,
  [PopupType.COPY_RANGE]: buildCopyRange,
  [PopupType.COPY_COLUMN_RANGE]: buildCopyRange,
  [PopupType.COPY_ROW_RANGE]: buildCopyRange,
  [PopupType.RANGE]: buildRange,
  [PopupType.XARRAY_DIMENSIONS]: xarrayDimensions,
  [PopupType.XARRAY_INDEXES]: xarrayIndexes,
  [PopupType.RENAME]: buildRename,
  [PopupType.REPLACEMENT]: buildReplacement,
  [PopupType.ERROR]: buildError,
  [PopupType.INSTANCES]: buildInstances,
  [PopupType.VARIANCE]: buildVariance,
  [PopupType.UPLOAD]: buildUpload,
  [PopupType.DUPLICATES]: buildDuplicates,
  [PopupType.EXPORT]: buildExport,
  [PopupType.HIDDEN]: () => ({}),
  [PopupType.DESCRIBE]: () => ({}),
  [PopupType.CHARTS]: () => ({}),
  [PopupType.ARCTICDB]: buildArcticDB,
  [PopupType.JUMP_TO_COLUMN]: buildJumpToColumn,
};

export const buildBodyAndTitle = (props: BuilderInput): BuilderOutput =>
  (POPUP_MAP as any)[props.chartData.type]?.(props) ?? {};
