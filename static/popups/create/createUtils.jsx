import _ from "lodash";
import React from "react";

import { default as CreateBins, validateBinsCfg } from "./CreateBins";
import { default as CreateCleaning, validateCleaningCfg } from "./CreateCleaning";
import { default as CreateDataSlope, validateDataSlopeCfg } from "./CreateDataSlope";
import { default as CreateDatetime, validateDatetimeCfg } from "./CreateDatetime";
import { default as CreateDiff, validateDiffCfg } from "./CreateDiff";
import { default as CreateEncoder, validateEncoderCfg } from "./CreateEncoder";
import { default as CreateExponentialSmoothing, validateExponentialSmoothingCfg } from "./CreateExponentialSmoothing";
import { default as CreateNumeric, validateNumericCfg } from "./CreateNumeric";
import { default as CreateRandom, validateRandomCfg } from "./CreateRandom";
import { default as CreateRolling, validateRollingCfg } from "./CreateRolling";
import { default as CreateSimilarity, validateSimilarityCfg } from "./CreateSimilarity";
import { default as CreateStandardized, validateStandardizedCfg } from "./CreateStandardized";
import { default as CreateString, validateStringCfg } from "./CreateString";
import { default as CreateTransform, validateTransformCfg } from "./CreateTransform";
import { default as CreateTypeConversion, validateTypeConversionCfg } from "./CreateTypeConversion";
import { default as CreateWinsorize, validateWinsorizeCfg } from "./CreateWinsorize";
import { default as CreateZScoreNormalize, validateZScoreNormalizeCfg } from "./CreateZScoreNormalize";

export const TYPES = _.concat(
  ["numeric", "string", "bins", "datetime", "random", "type_conversion", "transform", "winsorize", "zscore_normalize"],
  ["similarity", "standardize", "encoder", "cleaning", "diff", "data_slope", "rolling", "exponential_smoothing"]
);
export const LABELS = {
  zscore_normalize: "Z-Score Normalize",
  diff: "Row Difference",
};

export function buildLabel(v) {
  if (_.has(LABELS, v)) {
    return LABELS[v];
  }
  return _.join(_.map(_.split(v, "_"), _.capitalize), " ");
}

export function validateCfg(t, type, cfg) {
  switch (type) {
    case "datetime":
      return validateDatetimeCfg(t, cfg);
    case "encoder":
      return validateEncoderCfg(t, cfg);
    case "string":
      return validateStringCfg(t, cfg);
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
  }
  return null;
}

export function getBody(state, props, updateState) {
  switch (state.type) {
    case "numeric":
      return <CreateNumeric {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
    case "string":
      return <CreateString {..._.pick(state, ["columns", "namePopulated"])} updateState={updateState} />;
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
  }
  return null;
}

export function renderNameInput({ type, cfg }) {
  if (type === "type_conversion") {
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
  saveAs: "new",
  name: null,
  cfg: null,
  code: {},
  loadingColumns: true,
  loadingColumn: false,
  namePopulated: false,
};
