import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import * as gu from "../../../dtale/gridUtils";
import { cleaners } from "../../create/CreateCleaning";
import { analysisAggs } from "./Constants";
import FilterSelect from "./FilterSelect";

const cleanerOpts = t =>
  _.concat(
    [
      {
        value: "underscore_to_space",
        label: t("analysis:Replace underscores w/ space"),
      },
    ],
    _.filter(cleaners(t), "word_count")
  );

class OrdinalInputs extends React.Component {
  constructor(props) {
    super(props);
    const { type } = props;
    const hiddenChars = _.find(cleanerOpts(props.t), { value: "hidden_chars" });
    this.state = {
      ordinalCol: null,
      ordinalAgg: _.find(analysisAggs(props.t), { value: "sum" }),
      cleaners: type === "word_value_counts" || type === "value_counts" ? [{ ...hiddenChars }] : [],
    };
    this.updateOrdinal = this.updateOrdinal.bind(this);
    this.renderCleaners = this.renderCleaners.bind(this);
  }

  updateOrdinal(prop, val) {
    this.setState({ [prop]: val }, () => this.props.updateOrdinal(prop, val));
  }

  renderCleaners() {
    const { type, colType, t } = this.props;
    if ((type === "word_value_counts" || type === "value_counts") && colType === "string") {
      return (
        <div className="row pt-3" data-tip={t("Clean column of extraneous values")}>
          <div className="col-auto text-center pr-4 ml-auto mt-auto mb-auto">
            <b>{t("Cleaner")}</b>
          </div>
          <div className="col pl-0 mr-3 ordinal-dd cleaner-dd">
            <FilterSelect
              selectProps={{
                value: this.state.cleaners,
                options: cleanerOpts(t),
                onChange: v => this.updateOrdinal("cleaners", v),
                isClearable: true,
                isMulti: true,
              }}
              labelProp="label"
            />
          </div>
        </div>
      );
    }
    return null;
  }

  render() {
    const { cols, selectedCol, t } = this.props;
    let colOpts = _.filter(cols, c => c.name !== selectedCol && _.includes(["float", "int"], gu.findColType(c.dtype)));
    colOpts = _.sortBy(
      _.map(colOpts, c => ({ value: c.name })),
      c => _.toLower(c.value)
    );
    return (
      <div className="col">
        <div className="row">
          <div className="col-auto text-center pr-4">
            <div>
              <b>{t("Ordinal")}</b>
            </div>
            <div style={{ marginTop: "-.5em" }}>
              <small>({t("Choose Col/Agg")})</small>
            </div>
          </div>
          <div className="col-auto pl-0 mr-3 ordinal-dd">
            <FilterSelect
              selectProps={{
                value: this.state.ordinalCol,
                options: colOpts,
                onChange: v => this.updateOrdinal("ordinalCol", v),
                noOptionsText: () => t("analysis:No columns found"),
                isClearable: true,
              }}
            />
          </div>
          <div className="col-auto pl-0 mr-3 ordinal-dd">
            <FilterSelect
              selectProps={{
                value: this.state.ordinalAgg,
                options: analysisAggs(this.props.t),
                onChange: v => this.updateOrdinal("ordinalAgg", v),
              }}
              labelProp="label"
            />
          </div>
        </div>
        {this.renderCleaners()}
      </div>
    );
  }
}
OrdinalInputs.displayName = "OrdinalInputs";
OrdinalInputs.propTypes = {
  selectedCol: PropTypes.string,
  cols: PropTypes.array,
  updateOrdinal: PropTypes.func,
  type: PropTypes.string,
  colType: PropTypes.string,
  t: PropTypes.func,
};

export default withTranslation(["analysis", "builders", "constants"])(OrdinalInputs);
