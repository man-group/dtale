import { TFunction } from 'i18next';
import * as React from 'react';

import { ColumnDef } from '../../dtale/DataViewerState';
import { capitalize } from '../../stringUtils';
import { default as Resample, validateResampleCfg } from '../reshape/Resample';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import { default as CreateBins, validateBinsCfg } from './CreateBins';
import { default as CreateCleaning, validateCleaningCfg } from './CreateCleaning';
import {
  CleaningConfig,
  CreateColumnConfigs,
  CreateColumnType,
  CreateColumnTypeGroup,
  CreateColumnUpdateState,
  EncoderAlgoType,
  PrepopulateCreateColumn,
  ResampleConfig,
  SaveAs,
  TypeConversionConfig,
} from './CreateColumnState';
import { CreateConcatenate, validateConcatenateCfg } from './CreateConcatenate';
import { default as CreateCumsum, validateCumsumCfg } from './CreateCumsum';
import { default as CreateDataSlope, validateDataSlopeCfg } from './CreateDataSlope';
import { default as CreateDatetime, validateDatetimeCfg } from './CreateDatetime';
import { default as CreateDiff, validateDiffCfg } from './CreateDiff';
import { default as CreateEncoder, validateEncoderCfg } from './CreateEncoder';
import { default as CreateExpanding, validateExpandingCfg } from './CreateExpanding';
import { default as CreateExponentialSmoothing, validateExponentialSmoothingCfg } from './CreateExponentialSmoothing';
import { default as CreateNumeric, validateNumericCfg } from './CreateNumeric';
import { default as CreateRandom, validateRandomCfg } from './CreateRandom';
import { default as CreateReplace, validateReplaceCfg } from './CreateReplace';
import { default as CreateRolling, validateRollingCfg } from './CreateRolling';
import { default as CreateShift, validateShiftCfg } from './CreateShift';
import { default as CreateSimilarity, validateSimilarityCfg } from './CreateSimilarity';
import { default as CreateStandardized, validateStandardizedCfg } from './CreateStandardized';
import { default as CreateString, validateStringCfg } from './CreateString';
import { default as CreateStringSplitting, validateStringSplittingCfg } from './CreateStringSplitting';
import { default as CreateSubstring, validateSubstringCfg } from './CreateSubstring';
import { default as CreateTransform, validateTransformCfg } from './CreateTransform';
import { default as CreateTypeConversion, validateTypeConversionCfg } from './CreateTypeConversion';
import { default as CreateWinsorize, validateWinsorizeCfg } from './CreateWinsorize';
import { default as CreateZScoreNormalize, validateZScoreNormalizeCfg } from './CreateZScoreNormalize';

export const TYPE_GROUPS = [
  { buttons: [CreateColumnType.RANDOM], label: CreateColumnTypeGroup.GENERAL_DATA, className: 'first-type-group' },
  {
    buttons: [CreateColumnType.NUMERIC, CreateColumnType.STRING, CreateColumnType.BINS, CreateColumnType.DATETIME],
    label: CreateColumnTypeGroup.AGGREGATING_COLUMNS,
  },
  { buttons: [CreateColumnType.DIFF, CreateColumnType.CUMSUM], label: CreateColumnTypeGroup.ROW_ANALYSIS },
  {
    buttons: [
      CreateColumnType.TYPE_CONVERSION,
      CreateColumnType.TRANSFORM,
      CreateColumnType.WINSORIZE,
      CreateColumnType.ENCODER,
      CreateColumnType.ZSCORE_NORMALIZE,
      CreateColumnType.STANDARDIZE,
    ],
    label: CreateColumnTypeGroup.TRANSFORM_EXISTING_DATA,
  },
  {
    buttons: [
      CreateColumnType.ROLLING,
      CreateColumnType.EXPONENTIAL_SMOOTHING,
      CreateColumnType.DATA_SLOPE,
      CreateColumnType.SHIFT,
      CreateColumnType.EXPANDING,
      CreateColumnType.RESAMPLE,
    ],
    label: CreateColumnTypeGroup.TIMESERIES,
  },
  {
    buttons: [
      CreateColumnType.SIMILARITY,
      CreateColumnType.CLEANING,
      CreateColumnType.SUBSTRING,
      CreateColumnType.SPLIT,
      CreateColumnType.CONCATENATE,
      CreateColumnType.REPLACE,
    ],
    label: CreateColumnTypeGroup.TEXT,
    className: 'last-type-group',
  },
];

export const LABELS: { [k in CreateColumnType]?: string } = {
  [CreateColumnType.ZSCORE_NORMALIZE]: 'Z-Score Normalize',
  [CreateColumnType.DIFF]: 'Row Difference',
  [CreateColumnType.CUMSUM]: 'Cumulative Sum',
  [CreateColumnType.SHIFT]: 'Shifting',
  [CreateColumnType.SPLIT]: 'Split By Character',
};

export const buildLabel = (v: CreateColumnType): string => LABELS[v] ?? v.split('_').map(capitalize).join(' ');

export const validateCfg = (t: TFunction, cfg: CreateColumnConfigs): string | undefined => {
  switch (cfg.type) {
    case CreateColumnType.DATETIME:
      return validateDatetimeCfg(t, cfg.cfg);
    case CreateColumnType.ENCODER:
      return validateEncoderCfg(t, cfg.cfg);
    case CreateColumnType.STRING:
      return validateStringCfg(t, cfg.cfg);
    case CreateColumnType.CONCATENATE:
      return validateConcatenateCfg(t, cfg.cfg);
    case CreateColumnType.REPLACE:
      return validateReplaceCfg(t, cfg.cfg);
    case CreateColumnType.BINS:
      return validateBinsCfg(t, cfg.cfg);
    case CreateColumnType.RANDOM:
      return validateRandomCfg(t, cfg.cfg);
    case CreateColumnType.SIMILARITY:
      return validateSimilarityCfg(t, cfg.cfg);
    case CreateColumnType.STANDARDIZE:
      return validateStandardizedCfg(t, cfg.cfg);
    case CreateColumnType.TYPE_CONVERSION:
      return validateTypeConversionCfg(t, cfg.cfg);
    case CreateColumnType.TRANSFORM:
      return validateTransformCfg(t, cfg.cfg);
    case CreateColumnType.WINSORIZE:
      return validateWinsorizeCfg(t, cfg.cfg);
    case CreateColumnType.ZSCORE_NORMALIZE:
      return validateZScoreNormalizeCfg(t, cfg.cfg);
    case CreateColumnType.CUMSUM:
      return validateCumsumCfg(t, cfg.cfg);
    case CreateColumnType.NUMERIC:
      return validateNumericCfg(t, cfg.cfg);
    case CreateColumnType.CLEANING:
      return validateCleaningCfg(t, cfg.cfg);
    case CreateColumnType.DIFF:
      return validateDiffCfg(t, cfg.cfg);
    case CreateColumnType.DATA_SLOPE:
      return validateDataSlopeCfg(t, cfg.cfg);
    case CreateColumnType.ROLLING:
      return validateRollingCfg(t, cfg.cfg);
    case CreateColumnType.EXPONENTIAL_SMOOTHING:
      return validateExponentialSmoothingCfg(t, cfg.cfg);
    case CreateColumnType.SHIFT:
      return validateShiftCfg(t, cfg.cfg);
    case CreateColumnType.EXPANDING:
      return validateExpandingCfg(t, cfg.cfg);
    case CreateColumnType.SUBSTRING:
      return validateSubstringCfg(t, cfg.cfg);
    case CreateColumnType.SPLIT:
      return validateStringSplittingCfg(t, cfg.cfg);
    case CreateColumnType.RESAMPLE:
      return validateResampleCfg(cfg.cfg);
    default:
      return undefined;
  }
};

export const getBody = (
  type: CreateColumnType,
  columns: ColumnDef[],
  namePopulated: boolean,
  prePopulated: PrepopulateCreateColumn | undefined,
  updateState: (state: CreateColumnUpdateState) => void,
): React.ReactNode => {
  switch (type) {
    case CreateColumnType.NUMERIC:
      return <CreateNumeric {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.STRING:
      return <CreateString {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.CONCATENATE:
      return <CreateConcatenate {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.REPLACE:
      return <CreateReplace {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.DATETIME:
      return <CreateDatetime {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.ENCODER:
      return <CreateEncoder {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.BINS:
      return <CreateBins {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.RANDOM:
      return <CreateRandom {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.SIMILARITY:
      return <CreateSimilarity {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.STANDARDIZE:
      return <CreateStandardized {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.SUBSTRING:
      return <CreateSubstring {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.SPLIT:
      return <CreateStringSplitting {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.TYPE_CONVERSION:
      return (
        <CreateTypeConversion
          {...{ columns, namePopulated }}
          updateState={updateState}
          prePopulated={prePopulated?.cfg as TypeConversionConfig}
        />
      );
    case CreateColumnType.TRANSFORM:
      return <CreateTransform {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.WINSORIZE:
      return <CreateWinsorize {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.ZSCORE_NORMALIZE:
      return <CreateZScoreNormalize {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.CUMSUM:
      return <CreateCumsum {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.CLEANING:
      return (
        <CreateCleaning
          {...{ columns, namePopulated }}
          updateState={updateState}
          prePopulated={prePopulated?.cfg as CleaningConfig}
        />
      );
    case CreateColumnType.DIFF:
      return <CreateDiff {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.DATA_SLOPE:
      return <CreateDataSlope {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.ROLLING:
      return <CreateRolling {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.EXPONENTIAL_SMOOTHING:
      return <CreateExponentialSmoothing {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.SHIFT:
      return <CreateShift {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.EXPANDING:
      return <CreateExpanding {...{ columns, namePopulated }} updateState={updateState} />;
    case CreateColumnType.RESAMPLE:
      return (
        <Resample
          columns={columns}
          namePopulated={false}
          updateState={(state: { cfg: ResampleConfig; code: CreateColumnCodeSnippet; saveAs?: SaveAs }) =>
            updateState({ ...state, cfg: { type: CreateColumnType.RESAMPLE, cfg: state.cfg } })
          }
        />
      );
    default:
      return null;
  }
};

export const renderNameInput = (cfg: CreateColumnConfigs): string => {
  if ([CreateColumnType.TYPE_CONVERSION, CreateColumnType.CLEANING, CreateColumnType.REPLACE].includes(cfg.type)) {
    return 'name_inplace';
  } else if (cfg.type === CreateColumnType.ENCODER) {
    const algo = cfg.cfg.algo;
    if (algo === EncoderAlgoType.FEATURE_HASHER || algo === EncoderAlgoType.ONE_HOT) {
      return 'none';
    } else {
      return 'name_inplace';
    }
  } else if (cfg.type === CreateColumnType.RESAMPLE) {
    return 'none';
  } else {
    return 'name';
  }
};
