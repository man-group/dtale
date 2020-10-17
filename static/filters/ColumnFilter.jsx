import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { components } from "react-select";

import { buildURLString, saveColFilterUrl, toggleOutlierFilterUrl } from "../actions/url-utils";
import Descriptions from "../dtale/column/column-menu-descriptions.json";
import { exports as gu } from "../dtale/gridUtils";
import menuFuncs from "../dtale/menu/dataViewerMenuUtils";
import { fetchJson } from "../fetcher";
import { DateFilter } from "./DateFilter";
import { NumericFilter } from "./NumericFilter";
import { StringFilter } from "./StringFilter";

require("./ColumnFilter.css");

function getStyles() {
  return {
    label: "loadingIndicator",
    color: "hsl(0, 0%, 40%)",
    display: "flex",
    padding: 8,
    transition: "color 150ms",
    alignSelf: "center",
    fontSize: 4,
    lineHeight: 1,
    marginRight: 4,
    textAlign: "center",
    verticalAlign: "middle",
  };
}

function buildState({ columns, selectedCol, outlierFilters }) {
  const colCfg = _.find(columns, { name: selectedCol }) || {};
  const colType = gu.findColType(colCfg.dtype);
  return {
    colType,
    uniqueCt: colCfg.unique_ct,
    dtype: colCfg.dtype,
    hasOutliers: colCfg.hasOutliers > 0,
    queryApplied: _.has(outlierFilters, selectedCol),
    hasMissing: false,
    missing: false,
    loadingState: true,
  };
}

class ColumnFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = buildState(props);
    this.fetchData = this.fetchData.bind(this);
    this.updateState = this.updateState.bind(this);
    this.renderMissingToggle = this.renderMissingToggle.bind(this);
    this.renderOutlierToggle = this.renderOutlierToggle.bind(this);
    this.renderIcon = this.renderIcon.bind(this);
  }

  fetchData(state) {
    fetchJson(`/dtale/column-filter-data/${this.props.dataId}/${this.props.selectedCol}`, data => {
      if (data.success) {
        const missing = _.get(this.props.columnFilters, [this.props.selectedCol, "missing"], false);
        this.setState(_.assignIn(state || {}, { loadingState: false, missing }, data));
      }
    });
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedCol !== this.props.selectedCol) {
      this.fetchData(buildState(this.props));
    }
  }

  updateState(cfg) {
    const url = buildURLString(saveColFilterUrl(this.props.dataId, this.props.selectedCol), {
      cfg: JSON.stringify(cfg),
    });
    const updatedState = { cfg };
    if (_.has(cfg, "missing")) {
      updatedState.missing = cfg.missing;
    }
    this.setState(
      updatedState,
      fetchJson(url, data => this.props.propagateState({ columnFilters: data.currFilters || {} }))
    );
  }

  renderIcon(showIcon = true) {
    const buttonHandlers = menuFuncs.buildHotkeyHandlers(this.props);
    return (
      <span className="toggler-action">
        {showIcon && <i className="fa fa-filter align-bottom pointer" onClick={buttonHandlers.FILTER} />}
      </span>
    );
  }

  renderMissingToggle(showIcon) {
    const { hasMissing, missing, colType } = this.state;
    if (hasMissing) {
      const toggleMissing = () =>
        this.updateState(_.assignIn({}, this.state.cfg, { type: colType, missing: !missing }));
      return (
        <li>
          {this.renderIcon(showIcon)}
          <div className="m-auto">
            <div className="column-filter m-2">
              <span className="font-weight-bold pr-3">Show Only Missing</span>
              <i className={`ico-check-box${missing ? "" : "-outline-blank"} pointer`} onClick={toggleMissing} />
            </div>
          </div>
        </li>
      );
    }
    return null;
  }

  renderOutlierToggle(showIcon) {
    const { hasOutliers, queryApplied } = this.state;
    if (hasOutliers) {
      const toggleFilter = () => {
        const url = toggleOutlierFilterUrl(this.props.dataId, this.props.selectedCol);
        this.setState(
          { queryApplied: !queryApplied },
          fetchJson(url, data => this.props.propagateState(data))
        );
      };
      return (
        <li>
          {this.renderIcon(showIcon)}
          <div className="m-auto">
            <div className="column-filter m-2">
              <span className="font-weight-bold pr-3">Filter Outliers</span>
              <i className={`ico-check-box${queryApplied ? "" : "-outline-blank"} pointer`} onClick={toggleFilter} />
            </div>
          </div>
        </li>
      );
    }
    return null;
  }

  render() {
    if (this.state.loadingState) {
      return (
        <li className="hoverable">
          {this.renderIcon()}
          <div className="m-auto">
            <div className="column-filter m-2">
              <components.LoadingIndicator getStyles={getStyles} cx={() => ""} />
            </div>
          </div>
          <div className="hoverable__content col-menu-desc">{Descriptions.filter}</div>
        </li>
      );
    }
    const { colType } = this.state;
    let markup = null;
    switch (colType) {
      case "string":
      case "unknown": {
        if (!_.startsWith(this.state.dtype, "timedelta")) {
          markup = <StringFilter {..._.assignIn({}, this.props, this.state)} updateState={this.updateState} />;
        }
        break;
      }
      case "date":
        markup = <DateFilter {..._.assignIn({}, this.props, this.state)} updateState={this.updateState} />;
        break;
      case "int":
      case "float":
        markup = <NumericFilter {..._.assignIn({}, this.props, this.state)} updateState={this.updateState} />;
        break;
    }
    let missingToggle = null;
    if (_.isNull(markup)) {
      if (!this.state.hasMissing) {
        return null;
      }
      missingToggle = this.renderMissingToggle(true);
    } else {
      markup = (
        <li className="hoverable">
          {this.renderIcon()}
          <div className="m-auto">
            <div className="column-filter m-2">{markup}</div>
          </div>
          <div className="hoverable__content col-menu-desc">{Descriptions.filter}</div>
        </li>
      );
      missingToggle = this.renderMissingToggle(false);
    }
    return (
      <React.Fragment>
        {markup}
        {missingToggle}
        {this.renderOutlierToggle(_.isNull(markup) && _.isNull(missingToggle))}
      </React.Fragment>
    );
  }
}
ColumnFilter.displayName = "ColumnFilter";
ColumnFilter.propTypes = {
  columns: PropTypes.array,
  columnFilters: PropTypes.object,
  selectedCol: PropTypes.string,
  propagateState: PropTypes.func,
  dataId: PropTypes.string.isRequired,
  outlierFilters: PropTypes.object,
};

export default ColumnFilter;
