import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { RemovableError } from "../../../RemovableError";
import { updateSettings } from "../../../actions/settings";
import { dtypesUrl } from "../../../actions/url-utils";
import { fetchJson } from "../../../fetcher";
import serverStateManagement from "../../serverStateManagement";
import FilterInput from "./FilterInput";

require("./Panel.css");

function filterFilters(filters, columns) {
  return _.filter(filters, f => _.find(columns, { name: f.column }));
}

class ReactPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { filters: [] };
    this.save = this.save.bind(this);
    this.clearAll = this.clearAll.bind(this);
  }

  componentDidMount() {
    fetchJson(dtypesUrl(this.props.dataId), data => {
      const newState = {
        error: null,
      };
      if (data.error) {
        this.setState({ error: <RemovableError {...data} /> });
        return;
      }
      newState.filters = filterFilters(this.props.filters, data.dtypes);
      newState.columns = data.dtypes;
      this.setState(newState);
    });
  }

  save(name, value, active) {
    const { dataId, updateSettings } = this.props;
    const filterValues = { ...this.props.filterValues };
    if (value) {
      filterValues[name] = { value, active };
    } else {
      filterValues[name] = { active };
    }
    const settings = { predefinedFilters: filterValues };
    serverStateManagement.updateSettings(settings, dataId, () => updateSettings(settings));
  }

  clearAll() {
    const { dataId, updateSettings, filterValues } = this.props;
    const settings = {
      predefinedFilters: _.mapValues(filterValues, value => ({
        ...value,
        active: false,
      })),
    };
    serverStateManagement.updateSettings(settings, dataId, () => updateSettings(settings));
  }

  render() {
    const { dataId, filterValues, t } = this.props;
    const { filters, columns } = this.state;
    return (
      <>
        {this.state.error}
        <div className="row ml-0 mr-0">
          <div className="col-auto pl-0">
            <h2>{t("Predefined Filters", { ns: "menu" })}</h2>
          </div>
          <div className="col" />
          <div className="col-auto pr-0">
            <button className="btn btn-plain" onClick={this.props.hideSidePanel}>
              <i className="ico-close pointer" title={t("side:Close")} />
            </button>
          </div>
        </div>
        <div className="row m-0 pb-3">
          <div className="col" />
          <button className="btn btn-primary col-auto pt-2 pb-2" onClick={this.clearAll}>
            <span>{this.props.t("Clear All", { ns: "predefined" })}</span>
          </button>
        </div>
        {_.map(filters, (f, i) => (
          <FilterInput
            key={i}
            dataId={dataId}
            filter={f}
            value={_.get(filterValues, f.name)}
            save={this.save}
            columns={columns}
          />
        ))}
      </>
    );
  }
}
ReactPanel.displayName = "ReactPanel";
ReactPanel.propTypes = {
  dataId: PropTypes.string,
  filters: PropTypes.array,
  filterValues: PropTypes.object,
  hideSidePanel: PropTypes.func,
  updateSettings: PropTypes.func,
  t: PropTypes.func,
};
const TranslatedPanel = withTranslation(["menu", "predefined", "side"])(ReactPanel);
const ReduxPanel = connect(
  ({ dataId, predefinedFilters, settings }) => ({
    dataId,
    filters: predefinedFilters,
    filterValues: settings.predefinedFilters,
  }),
  dispatch => ({
    hideSidePanel: () => dispatch({ type: "hide-side-panel" }),
    updateSettings: settings => dispatch(updateSettings(settings)),
  })
)(TranslatedPanel);
export { ReduxPanel as Panel, TranslatedPanel as ReactPanel };
