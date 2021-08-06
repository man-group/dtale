import _ from "lodash";
import React from "react";

import { default as CreateBins, validateBinsCfg } from "./CreateBins";
import { default as CreateCleaning, validateCleaningCfg } from "./CreateCleaning";
import { default as CreateConcatenate, validateConcatenateCfg } from "./CreateConcatenate";
import { default as CreateCumsum, validateCumsumCfg } from "./CreateCumsum";
import { default as CreateDataSlope, validateDataSlopeCfg } from "./CreateDataSlope";
import { default as CreateDatetime, validateDatetimeCfg } from "./CreateDatetime";
import { default as CreateDiff, validateDiffCfg } from "./CreateDiff";
import { default as CreateEncoder, validateEncoderCfg } from "./CreateEncoder";
import { default as CreateExpanding, validateExpandingCfg } from "./CreateExpanding";
import { default as CreateExponentialSmoothing, validateExponentialSmoothingCfg } from "./CreateExponentialSmoothing";
import { default as CreateNumeric, validateNumericCfg } from "./CreateNumeric";
import { default as CreateRandom, validateRandomCfg } from "./CreateRandom";
import { default as CreateReplace, validateReplaceCfg } from "./CreateReplace";
import { default as CreateRolling, validateRollingCfg } from "./CreateRolling";
import { default as CreateShift, validateShiftCfg } from "./CreateShift";
import { default as CreateSimilarity, validateSimilarityCfg } from "./CreateSimilarity";
import { default as CreateStandardized, validateStandardizedCfg } from "./CreateStandardized";
import { default as CreateString, validateStringCfg } from "./CreateString";
import { default as CreateStringSplitting, validateStringSplittingCfg } from "./CreateStringSplitting";
import { default as CreateSubstring, validateSubstringCfg } from "./CreateSubstring";
import { default as CreateTransform, validateTransformCfg } from "./CreateTransform";
import { default as CreateTypeConversion, validateTypeConversionCfg } from "./CreateTypeConversion";
import { default as CreateWinsorize, validateWinsorizeCfg } from "./CreateWinsorize";
import { default as CreateZScoreNormalize, validateZScoreNormalizeCfg } from "./CreateZScoreNormalize";

export const TYPE_GROUPS = [
  { buttons: ["random"], label: "General Data", className: "first-type-group" },
  {
    buttons: ["numeric", "string", "bins", "datetime"],
    label: "Aggregating Columns",
  },
  { buttons: ["diff", "cumsum"], label: "Row Analysis" },
  {
    buttons: ["type_conversion", "transform", "winsorize", "encoder", "zscore_normalize", "standardize"],
    label: "Transform Existing Data",
  },
  {
    buttons: ["rolling", "exponential_smoothing", "data_slope", "shift", "expanding"],
    label: "Timeseries",
  },
  {
    buttons: ["similarity", "cleaning", "substring", "split", "concatenate", "replace"],
    label: "Text",
    className: "last-type-group",
  },
];

export const LABELS = {
  zscore_normalize: "Z-Score Normalize",
  diff: "Row Difference",
  cumsum: "Cumulative Sum",
  shift: "Shifting",
  split: "Split By Character",
};

export function buildLabel(v) {
  if (_.has(LABELS, v)) {
    return LABELS[v];
  }
  return _.join(_.map(v.split("_"), _.capitalize), " ");
}

// eslint-disable-next-line complexity
export function validateCfg(t, type, cfg) {
  switch (type) {
    case "datetime":
      return validateDatetimeCfg(t, cfg);
    case "encoder":
      return validateEncoderCfg(t, cfg);
    case "string":
      return validateStringCfg(t, cfg);
    case "concatenate":
      return validateConcatenateCfg(t, cfg);
    case "replace":
      return validateReplaceCfg(t, cfg);
    case "bins":
      return validateBinsCfg(t, cfg);
    case "random":
      return validateRandomCfg(t, cfg);
    case "similarity":
      return validateSimilarityCfg(t, cfg);
    case "standardize":
      return validateStandardizedCfg(t, cfg);
    case "type_conversion":
      return validateTypeConversionCfg(t, cfg);
    case "transform":
      return validateTransformCfg(t, cfg);
    case "winsorize":
      return validateWinsorizeCfg(t, cfg);
    case "zscore_normalize":
      return validateZScoreNormalizeCfg(t, cfg);
    case "cumsum":
      return validateCumsumCfg(t, cfg);
    case "numeric":
      return validateNumericCfg(t, cfg);
    case "cleaning":
      return validateCleaningCfg(t, cfg);
    case "diff":
      return validateDiffCfg(t, cfg);
    case "data_slope":
      return validateDataSlopeCfg(t, cfg);
    case "rolling":
      return validateRollingCfg(t, cfg);
    case "exponential_smoothing":
      return validateExponentialSmoothingCfg(t, cfg);
    case "shift":
      return validateShiftCfg(t, cfg);
    case "expanding":
      return validateExpandingCfg(t, cfg);
    case "substring":
      return validateSubstringCfg(t, cfg);
    case "split":
      return validateStringSplittingCfg(t, cfg);
  }
  return null;
}

// eslint-disable-next-line complexity
export function getBody(state, props, updateState) {
  switch (state.type) {
    case "numeric":
      return <CreateNumeric {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "string":
      return <CreateString {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "concatenate":
      return <CreateConcatenate {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "replace":
      return <CreateReplace {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "datetime":
      return <CreateDatetime {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "encoder":
      return <CreateEncoder {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "bins":
      return <CreateBins {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "random":
      return <CreateRandom {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "similarity":
      return <CreateSimilarity {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "standardize":
      return <CreateStandardized {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "substring":
      return <CreateSubstring {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "split":
      return <CreateStringSplitting {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "type_conversion":
      return (
        <CreateTypeConversion
          {..._.pick(state, ["columns", "namePopulated"])}
          updateState={updateState}
          prePopulated={_.get(props, "prePopulated.cfg") || {}}
        />
      );
    case "transform":
      return <CreateTransform {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "winsorize":
      return <CreateWinsorize {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "zscore_normalize":
      return <CreateZScoreNormalize {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "cumsum":
      return <CreateCumsum {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "cleaning":
      return (
        <CreateCleaning
          {..._.pick(state, ["columns", "namePopulated"])}
          updateState={updateState}
          prePopulated={_.get(props, "prePopulated.cfg") || {}}
        />
      );
    case "diff":
      return <CreateDiff {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "data_slope":
      return <CreateDataSlope {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "rolling":
      return <CreateRolling {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "exponential_smoothing":
      return <CreateExponentialSmoothing {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "shift":
      return <CreateShift {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "expanding":
      return <CreateExpanding {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
  }
  return null;
}

export function renderNameInput({ type, cfg }) {
  if (_.includes(["type_conversion", "cleaning", "replace"], type)) {
    return "name_inplace";
  } else if (type === "encoder") {
    const algo = _.get(cfg, "algo");
    if (algo === "feature_hasher" || algo === "one_hot") {
      return "none";
    } else {
      return "name_inplace";
    }
  } else {
    return "name";
  }
}

export const BASE_STATE = {
  type: "numeric",
  typeGroup: "Aggregating Columns",
  saveAs: "new",
  name: null,
  cfg: null,
  code: {},
  loadingColumns: true,
  loadingColumn: false,
  namePopulated: false,
};
