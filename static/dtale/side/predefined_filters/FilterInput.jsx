import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { buildURLString, columnFilterDataUrl } from "../../../actions/url-utils";
import * as gu from "../../../dtale/gridUtils";
import { fetchJson } from "../../../fetcher";
import AsyncValueSelect from "../../../filters/AsyncValueSelect";
import ValueSelect from "../../../filters/ValueSelect";
import { buildStat } from "../../../popups/describe/detailUtils";
import { predefinedFilterStr } from "../../info/infoUtils";
import ButtonToggle from "../../../ButtonToggle";

function buildCurrent(props) {
  const { filter } = props;
  const { value } = props.value ?? {};
  const { inputType } = filter;
  switch (inputType) {
    case "input":
      return `${value ?? ""}`;
    case "select":
      return value ? { value } : null;
    case "multiselect":
      return value ? value.map(v => ({ value: v })) : null;
  }
  return value;
}

function buildFinal(currentValue, inputType) {
  switch (inputType) {
    case "input":
      return currentValue;
    case "select":
      return currentValue ? currentValue.value : null;
    case "multiselect":
      return currentValue ? _.map(currentValue, "value") : null;
  }
  return currentValue;
}

class FilterInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
      active: props.value?.active ?? true,
      toggleCt: 0,
      currentValue: buildCurrent(props),
    };
    this.toggleEdited = this.toggleEdited.bind(this);
    this.renderEdited = this.renderEdited.bind(this);
    this.save = this.save.bind(this);
    this.toggleActive = this.toggleActive.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.setState({ currentValue: buildCurrent(this.props) });
    }
  }

  toggleEdited() {
    const { edit, toggleCt } = this.state;
    const { dataId, filter, columns } = this.props;
    const { column } = filter;
    const colCfg = _.find(columns, { name: column }, {});
    const requiresAsync = colCfg.unique_ct > 500;
    if (this.state.toggleCt == 0 && filter.inputType !== "input" && !requiresAsync) {
      fetchJson(
        buildURLString(columnFilterDataUrl(dataId), {
          col: column,
        }),
        data => {
          if (data.success) {
            this.setState({ ...data, toggleCt: toggleCt + 1, edit: !edit });
          }
        }
      );
    } else {
      this.setState({ toggleCt: toggleCt + 1, edit: !edit });
    }
  }

  save() {
    const { filter, columns } = this.props;
    const { name, column, inputType } = filter;
    const colCfg = _.find(columns, { name: column }, {});
    const colType = gu.findColType(colCfg.dtype);
    const value = buildFinal(this.state.currentValue, inputType);
    const errors = [];
    let finalValues = [];
    _.concat([], value).forEach(val => {
      if (colType == "int" && val) {
        const parsedVal = parseInt(val);
        if (_.isNaN(parsedVal)) {
          errors.push(`Invalid integer, ${val}!`);
        } else {
          finalValues.push(parsedVal);
        }
      } else if (colType == "float" && val) {
        const parsedVal = parseFloat(val);
        if (_.isNaN(parsedVal)) {
          errors.push(`Invalid float, ${val}!`);
        } else {
          finalValues.push(parsedVal);
        }
      } else {
        finalValues.push(val);
      }
    });
    if (_.size(errors)) {
      this.setState({ errors });
    } else {
      if (inputType !== "multiselect") {
        finalValues = finalValues[0];
      }
      this.setState({ errors: null, edit: false }, () => this.props.save(name, finalValues, this.state.active));
    }
  }

  toggleActive(active) {
    this.setState({ active }, () => this.props.save(this.props.filter.name, this.props.value?.value, active));
  }

  renderEdited() {
    if (!this.state.edit) {
      return null;
    }
    const { filter, columns, dataId } = this.props;
    const { column, inputType } = filter;
    const colCfg = _.find(columns, { name: column }, {});
    const requiresAsync = colCfg.unique_ct > 500;
    switch (inputType) {
      case "input":
        return (
          <input value={this.state.currentValue} onChange={e => this.setState({ currentValue: e.target.value })} />
        );
      case "select":
      case "multiselect": {
        const multiSelect = inputType === "multiselect";
        if (requiresAsync) {
          return (
            <AsyncValueSelect
              {...colCfg}
              uniques={this.state.uniques}
              isMulti={multiSelect}
              dataId={dataId}
              selected={this.state.currentValue}
              updateState={({ selected }) => this.setState({ currentValue: selected })}
            />
          );
        } else {
          return (
            <ValueSelect
              {...colCfg}
              uniques={this.state.uniques}
              isMulti={multiSelect}
              selected={this.state.currentValue}
              updateState={({ selected }) => this.setState({ currentValue: selected })}
            />
          );
        }
      }
      default:
        return `Unknown "input_type" specified: ${inputType}`;
    }
  }

  render() {
    const { edit, errors } = this.state;
    const { value, filter, t } = this.props;
    const { name, description, column } = filter;
    return (
      <div key={name} className="row ml-0 mr-0 mb-5 predefined-filter-input">
        <div className="col-md-12">
          <div className="row">
            <h2 className="font-weight-bold col">{name}</h2>
            {!edit && (
              <button className="btn btn-primary col-auto pt-2 pb-2 mb-auto mt-3 mr-3" onClick={this.toggleEdited}>
                {t("predefined:Edit")}
              </button>
            )}
            {edit && (
              <button className="btn btn-primary col-auto pt-2 pb-2 mb-auto mt-2 mr-2" onClick={this.toggleEdited}>
                {t("predefined:Cancel")}
              </button>
            )}
            {edit && (
              <button className="btn btn-primary col-auto pt-2 pb-2 mb-auto mt-2 mr-2" onClick={this.save}>
                {t("predefined:Save")}
              </button>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <ul>
            <li>{buildStat(t, "predefined:Column", column)}</li>
            <li>{buildStat(t, "predefined:Description", description)}</li>
          </ul>
        </div>
        <div className="col-md-6">
          <div className="row">
            <div className="col-md-12">
              {!edit && (
                <>
                  <span className="font-weight-bold pr-3">{t("Current Value", { ns: "predefined" })}:</span>
                  <span>{gu.predefinedHasValue(value) ? predefinedFilterStr([filter], name, value.value) : "--"}</span>
                </>
              )}
              {this.renderEdited()}
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <ButtonToggle
                options={_.map(
                  [
                    ["Enabled", "true"],
                    ["Disabled", "false"],
                  ],
                  ([l, v]) => ({
                    label: l,
                    value: v,
                  })
                )}
                update={active => this.toggleActive(active === "true")}
                defaultValue={this.state.active ? "true" : "false"}
                className="pl-0 pr-0 pt-3 float-right"
              />
            </div>
          </div>
          {errors && (
            <ul className="predefined-filter-errors">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
}
FilterInput.displayName = "FilterInput";
FilterInput.propTypes = {
  dataId: PropTypes.string,
  filter: PropTypes.object,
  value: PropTypes.any,
  columns: PropTypes.array,
  save: PropTypes.func,
  t: PropTypes.func,
};
export default withTranslation(["menu", "predefined", "side"])(FilterInput);
