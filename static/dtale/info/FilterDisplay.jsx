import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { updateSettings } from "../../actions/settings";
import * as gu from "../gridUtils";
import serverState from "../serverStateManagement";
import { buildMenuHandler, predefinedFilterStr } from "./infoUtils";

const removeBackticks = query => query.replace(/`/g, "");

function displayQueries(props, prop) {
  const queries = props[prop];
  return _.map(queries, (cfg, col) => {
    const dropColFilter = () => {
      const updatedSettings = {
        [prop]: _.pickBy(queries, (_, k) => k !== col),
      };
      serverState.updateSettings(updatedSettings, props.dataId, () => props.updateSettings(updatedSettings));
    };
    return (
      <li key={`${prop}-${col}`}>
        <span className="toggler-action">
          <button className="btn btn-plain ignore-clicks" onClick={dropColFilter}>
            <i className="ico-cancel mr-4" />
          </button>
        </span>
        <span className="font-weight-bold text-nowrap">{removeBackticks(cfg.query)}</span>
      </li>
    );
  });
}

class ReactFilterDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.displayPredefined = this.displayPredefined.bind(this);
  }

  displayPredefined() {
    const { predefinedFilters, predefinedFilterConfigs, dataId, updateSettings } = this.props;
    return _.map(gu.filterPredefined(predefinedFilters), (value, name) => {
      const dropFilter = () => {
        const updatedSettings = {
          predefinedFilters: {
            ...predefinedFilters,
            [name]: { value: predefinedFilters[name].value, active: false },
          },
        };
        serverState.updateSettings(updatedSettings, dataId, () => updateSettings(updatedSettings));
      };
      const displayValue = predefinedFilterStr(predefinedFilterConfigs, name, value.value);
      return (
        <li key={`predefined-${name}`}>
          <span className="toggler-action">
            <button className="btn btn-plain ignore-clicks" onClick={dropFilter}>
              <i className="ico-cancel mr-4" />
            </button>
          </span>
          <span className="font-weight-bold text-nowrap">{`${name}: ${displayValue}`}</span>
        </li>
      );
    });
  }

  render() {
    const { query, columnFilters, menuOpen, outlierFilters, predefinedFilterConfigs, dataId, updateSettings, t } =
      this.props;
    if (gu.noFilters(this.props)) {
      return null;
    }
    const label = <div className="font-weight-bold d-inline-block">{`${t("Filter")}:`}</div>;
    const filterSegs = _.concat(
      _.map(columnFilters, "query"),
      _.map(outlierFilters, "query"),
      _.map(
        gu.filterPredefined(this.props.predefinedFilters),
        (value, name) => `${name}: ${predefinedFilterStr(predefinedFilterConfigs, name, value.value)}`
      )
    );
    if (query) {
      filterSegs.push(query);
    }
    const clearFilter =
      (drop = false) =>
      () => {
        const settingsUpdates = {
          query: "",
          columnFilters: {},
          outlierFilters: {},
          predefinedFilters: _.mapValues(this.props.predefinedFilters, value => ({
            ...value,
            active: false,
          })),
          invertFilter: false,
        };
        const callback = () => updateSettings(settingsUpdates);
        if (drop) {
          serverState.dropFilteredRows(dataId, callback);
        } else {
          serverState.updateSettings(settingsUpdates, dataId, callback);
        }
      };
    const toggleInvert = () => {
      const settingsUpdates = { invertFilter: !this.props.invertFilter };
      serverState.updateSettings(settingsUpdates, dataId, () => updateSettings(settingsUpdates));
    };
    const moveToCustom = () =>
      serverState.moveFiltersToCustom(dataId, ({ settings }) => {
        updateSettings(settings, () => this.props.showSidePanel("filter"));
      });
    const allButtons = (
      <>
        <i
          className="ico-cancel pl-3 pointer"
          style={{ marginTop: "-0.1em" }}
          onClick={clearFilter()}
          title={t("Clear Filters")}
        />
        {!this.props.hideDropRows && (
          <i
            className="fas fa-eraser pl-3 pointer"
            style={{ marginTop: "-0.1em" }}
            onClick={clearFilter(true)}
            title={t("Drop Filtered Rows")}
          />
        )}
        <i
          className="fas fa-retweet pl-3 pointer"
          style={{
            marginTop: "-0.1em",
            opacity: this.props.invertFilter ? 1 : 0.5,
          }}
          onClick={toggleInvert}
          title={t("Invert Filter")}
        />
        {(!_.isEmpty(columnFilters) || !_.isEmpty(outlierFilters)) && (
          <i
            className="fa fa-filter pl-3 pointer"
            style={{ marginTop: "-0.1em" }}
            onClick={moveToCustom}
            title={t("Move Filters To Custom")}
          />
        )}
      </>
    );

    if (_.size(filterSegs) == 1) {
      return (
        <>
          {label}
          <div className="pl-3 d-inline-block filter-menu-toggle">{removeBackticks(filterSegs[0])}</div>
          {allButtons}
        </>
      );
    }
    const clickHandler = buildMenuHandler("filter", this.props.propagateState);
    let filterText = _.join(filterSegs, " and ");
    if (_.size(filterText) > 30) {
      filterText = _.truncate(removeBackticks(filterText), { length: 30 });
    }
    return (
      <>
        {label}
        <div className="pl-3 d-inline-block filter-menu-toggle" onClick={clickHandler}>
          <span className="pointer">{filterText}</span>
          <div className="column-toggle__dropdown" hidden={menuOpen !== "filter"}>
            <ul>
              {displayQueries(this.props, "columnFilters")}
              {displayQueries(this.props, "outlierFilters")}
              {this.displayPredefined()}
              {query && (
                <li>
                  <span className="toggler-action">
                    <button
                      className="btn btn-plain ignore-clicks"
                      onClick={() =>
                        serverState.updateSettings({ query: "" }, dataId, () => updateSettings({ query: "" }))
                      }>
                      <i className="ico-cancel mr-4" />
                    </button>
                  </span>
                  <span className="font-weight-bold text-nowrap">{query}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
        {allButtons}
      </>
    );
  }
}
ReactFilterDisplay.displayName = "ReactFilterDisplay";
ReactFilterDisplay.defaultProps = { invertFilter: false };
ReactFilterDisplay.propTypes = {
  updateSettings: PropTypes.func,
  dataId: PropTypes.string,
  query: PropTypes.string,
  columnFilters: PropTypes.object,
  outlierFilters: PropTypes.object,
  predefinedFilters: PropTypes.object,
  predefinedFilterConfigs: PropTypes.array,
  invertFilter: PropTypes.bool,
  menuOpen: PropTypes.string,
  propagateState: PropTypes.func,
  t: PropTypes.func,
  hideDropRows: PropTypes.bool,
  showSidePanel: PropTypes.func,
};

const TranslatedFilterDisplay = withTranslation("main")(ReactFilterDisplay);
const ReduxFilterDisplay = connect(
  ({ dataId, predefinedFilters, settings, hideDropRows }) => ({
    dataId,
    predefinedFilterConfigs: predefinedFilters,
    ...settings,
    hideDropRows,
  }),
  dispatch => ({
    updateSettings: (settings, callback) => dispatch(updateSettings(settings, callback)),
    showSidePanel: view => dispatch({ type: "show-side-panel", view }),
  })
)(TranslatedFilterDisplay);
export { ReduxFilterDisplay as FilterDisplay, TranslatedFilterDisplay as ReactFilterDisplay };
