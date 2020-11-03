import _ from "lodash";

export const AGGREGATION_OPTS = [
  { value: "count", label: "Count" },
  { value: "nunique", label: "Unique Count" },
  { value: "sum", label: "Sum" },
  { value: "mean", label: "Mean" },
  { value: "rolling", label: "Rolling" },
  { value: "first", label: "First" },
  { value: "last", label: "Last" },
  { value: "median", label: "Median" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "std", label: "Standard Deviation" },
  { value: "var", label: "Variance" },
  { value: "mad", label: "Mean Absolute Deviation" },
  { value: "prod", label: "Product of All Items" },
];

export const PIVOT_AGGS = _.reject(AGGREGATION_OPTS, { value: "rolling" });

export const ROLLING_COMPS = [
  { value: "corr", label: "Correlation" },
  { value: "count", label: "Count" },
  { value: "cov", label: "Covariance" },
  { value: "kurt", label: "Kurtosis" },
  { value: "max", label: "Maximum" },
  { value: "mean", label: "Mean" },
  { value: "median", label: "Median" },
  { value: "min", label: "Minimum" },
  { value: "skew", label: "Skew" },
  { value: "std", label: "Standard Deviation" },
  { value: "sum", label: "Sum" },
  { value: "var", label: "Variance" },
];

export const ANALYSIS_AGGS = _.concat(AGGREGATION_OPTS, [{ value: "pctsum", label: "Percentage Sum" }]);
export const TITLES = {
  histogram: "Histogram",
  value_counts: "Value Counts",
  boxplot: "Describe",
  categories: "Categories",
  word_value_counts: "Word Value Counts",
};
