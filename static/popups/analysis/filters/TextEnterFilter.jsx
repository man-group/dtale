import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import * as gu from "../../../dtale/gridUtils";

class TextEnterFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { [props.prop]: props.defaultValue ?? null };
    this.updateValue = this.updateValue.bind(this);
  }

  componentDidUpdate() {
    if (this.props.defaultValue !== this.state[this.props.prop]) {
      this.setState({ [this.props.prop]: this.props.defaultValue });
    }
  }

  updateValue(event) {
    const { prop, propagateState } = this.props;
    const updatedState = { [prop]: event.target.value };
    this.setState(updatedState, () => propagateState(updatedState));
  }

  render() {
    const { prop, dtype, buildChart, t } = this.props;
    const colType = gu.findColType(dtype);
    const updateFilter = e => {
      if (e.key === "Enter") {
        if (this.state[prop] && parseInt(this.state[prop])) {
          buildChart();
        }
        e.preventDefault();
      }
    };
    return (
      <React.Fragment>
        <div className={`col-auto text-center pr-4 ${colType === "int" ? "pl-0" : ""}`}>
          <div>
            <b>{t(_.capitalize(prop))}</b>
          </div>
          <div style={{ marginTop: "-.5em" }}>
            <small>{`(${t("Please edit")})`}</small>
          </div>
        </div>
        <div style={{ width: "3em" }} data-tip={t("Press ENTER to submit")}>
          <input
            type="text"
            className="form-control text-center column-analysis-filter"
            value={this.state[prop] ?? ""}
            onChange={this.updateValue}
            onKeyDown={updateFilter}
          />
        </div>
      </React.Fragment>
    );
  }
}
TextEnterFilter.displayName = "TextEnterFilter";
TextEnterFilter.propTypes = {
  prop: PropTypes.string,
  dtype: PropTypes.string,
  propagateState: PropTypes.func,
  buildChart: PropTypes.func,
  defaultValue: PropTypes.string,
  t: PropTypes.func,
};

export default withTranslation("text_enter")(TextEnterFilter);
