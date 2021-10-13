import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import * as gu from "../../../dtale/gridUtils";
import { analysisAggs } from "./Constants";
import FilterSelect from "./FilterSelect";

class CategoryInputs extends React.Component {
  constructor(props) {
    super(props);
    let colOpts = _.reject(props.cols, c => c.name === props.selectedCol || gu.findColType(c.dtype) === "float");
    colOpts = _.sortBy(
      _.map(colOpts, c => ({ value: c.name })),
      c => _.toLower(c.value)
    );
    this.state = {
      categoryCol: _.head(colOpts),
      colOpts,
      categoryAgg: _.find(analysisAggs(props.t), { value: "mean" }),
    };
  }

  componentDidMount() {
    if (this.state.categoryCol) {
      this.props.updateCategory("categoryCol", this.state.categoryCol);
    }
  }

  render() {
    const { t } = this.props;
    const updateCategory = (prop, val) => this.setState({ [prop]: val }, () => this.props.updateCategory(prop, val));
    return (
      <React.Fragment>
        <div className="col-auto text-center pr-4">
          <div>
            <b>{t("Category Breakdown", { ns: "analysis" })}</b>
          </div>
          <div style={{ marginTop: "-.5em" }}>
            <small>{`(${t("Choose Col/Agg", { ns: "analysis" })})`}</small>
          </div>
        </div>
        <div className="col-auto pl-0 mr-3 ordinal-dd">
          <FilterSelect
            selectProps={{
              value: this.state.categoryCol,
              options: this.state.colOpts,
              onChange: v => updateCategory("categoryCol", v),
              noOptionsText: () => t("No columns found"),
              isClearable: true,
            }}
          />
        </div>
        <div className="col-auto pl-0 mr-3 ordinal-dd">
          <FilterSelect
            selectProps={{
              value: this.state.categoryAgg,
              options: _.reject(analysisAggs(this.props.t), ({ value }) => value === "count"),
              onChange: v => updateCategory("categoryAgg", v),
            }}
            labelProp="label"
          />
        </div>
      </React.Fragment>
    );
  }
}
CategoryInputs.displayName = "CategoryInputs";
CategoryInputs.propTypes = {
  selectedCol: PropTypes.string,
  cols: PropTypes.array,
  updateCategory: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["analysis", "constants"])(CategoryInputs);
