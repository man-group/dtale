import _ from "lodash";

export const aggregationOpts = t => [
  { value: "count", label: t("constants:Count") },
  { value: "nunique", label: t("constants:Unique Count") },
  { value: "sum", label: t("constants:Sum") },
  { value: "mean", label: t("constants:Mean") },
  { value: "rolling", label: t("constants:Rolling") },
  { value: "first", label: t("constants:Keep First") },
  { value: "last", label: t("constants:Keep Last") },
  { value: "median", label: t("constants:Median") },
  { value: "min", label: t("constants:Minimum") },
  { value: "max", label: t("constants:Maximum") },
  { value: "std", label: t("constants:Standard Deviation") },
  { value: "var", label: t("constants:Variance") },
  { value: "mad", label: t("constants:Mean Absolute Deviation") },
  { value: "prod", label: t("constants:Product of All Items") },
];

export const pivotAggs = t => _.reject(aggregationOpts(t), { value: "rolling" });

export const rollingComps = t => [
  { value: "corr", label: t("constants:Correlation") },
  { value: "count", label: t("constants:Count") },
  { value: "cov", label: t("constants:Covariance") },
  { value: "kurt", label: t("constants:Kurtosis") },
  { value: "max", label: t("constants:Maximum") },
  { value: "mean", label: t("constants:Mean") },
  { value: "median", label: t("constants:Median") },
  { value: "min", label: t("constants:Minimum") },
  { value: "skew", label: t("constants:Skew") },
  { value: "std", label: t("constants:Standard Deviation") },
  { value: "sum", label: t("constants:Sum") },
  { value: "var", label: t("constants:Variance") },
];

export const analysisAggs = t => _.concat(pivotAggs(t), [{ value: "pctsum", label: t("constants:Percentage Sum") }]);

export const resampleAggs = t => _.concat(pivotAggs(t), [{ value: "ohlc", label: t("constants:OHLC") }]);

export const titles = t => ({
  histogram: t("constants:Histogram"),
  value_counts: t("constants:Value Counts"),
  boxplot: t("constants:Describe"),
  categories: t("constants:Categories"),
  word_value_counts: t("constants:Word Value Counts"),
  geolocation: t("constants:Geolocation"),
  qq: t("constants:Q-Q Plot"),
});
