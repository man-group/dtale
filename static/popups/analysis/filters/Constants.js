import _ from "lodash";
import { AGGREGATION_OPTS } from "../../charts/Aggregations";

export const ANALYSIS_AGGS = _.concat(AGGREGATION_OPTS, [{ value: "pctsum", label: "Percentage Sum" }]);
export const TITLES = {
  histogram: "Histogram",
  value_counts: "Value Counts",
  boxplot: "Describe",
  categories: "Categories",
  word_value_counts: "Word Value Counts",
};
