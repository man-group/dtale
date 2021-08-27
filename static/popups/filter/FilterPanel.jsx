import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { Bouncer } from "../../Bouncer";
import { RemovableError } from "../../RemovableError";
import { setQueryEngine } from "../../actions/dtale";
import { updateSettings } from "../../actions/settings";
import serverState from "../../dtale/serverStateManagement";
import { SidePanelButtons } from "../../dtale/side/SidePanelButtons";
import ContextVariables from "./ContextVariables";
import PandasQueryHelp from "./PandasQueryHelp";
import QueryExamples from "./QueryExamples";
import StructuredFilters from "./StructuredFilters";
import { loadInfo, saveFilter } from "./filterUtils";

class ReactFilterPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { query: "", error: null };
    this.save = this.save.bind(this);
    this.dropFilter = this.dropFilter.bind(this);
    this.clear = this.clear.bind(this);
  }

  componentDidMount() {
    loadInfo(this.props.dataId, state => this.setState(state));
  }

  save() {
    const callback = data => {
      if (data.error) {
        this.setState({ error: data.error, traceback: data.traceback });
        return;
      }
      this.props.updateSettings({ query: this.state.query }, this.props.hideSidePanel);
    };
    saveFilter(this.props.dataId, this.state.query, callback);
  }

  dropFilter(prop, col) {
    const { dataId } = this.props;
    const filters = this.state[prop];
    const updatedSettings = {
      [prop]: _.pickBy(filters, (_, k) => k !== col),
    };
    serverState.updateSettings(updatedSettings, dataId, () => {
      this.props.updateSettings(updatedSettings, () => this.setState(updatedSettings));
    });
  }

  clear() {
    serverState.updateSettings({ query: "" }, this.props.dataId, () => {
      this.props.updateSettings({ query: "" }, this.props.hideSidePanel);
    });
  }

  render() {
    if (this.state.loading) {
      return <Bouncer />;
    }
    const { t, queryEngine, setEngine } = this.props;
    const updateEngine = engine => () => serverState.updateQueryEngine(engine, () => setEngine(engine));
    return (
      <React.Fragment>
        <RemovableError {...this.state} onRemove={() => this.setState({ error: null, traceback: null })} />
        <div className="row">
          <div className="col-md-12">
            <div className="row m-0">
              <h1 className="mb-0">{t("Filters")}</h1>
              <div className="col" />
              <SidePanelButtons />
            </div>
            <div className="row m-0 pb-3">
              <div className="col p-0 font-weight-bold mt-auto">{t("Custom Filter")}</div>
              <PandasQueryHelp />
              <button className="btn btn-primary col-auto pt-2 pb-2" onClick={this.clear}>
                <span>{this.props.t("Clear")}</span>
              </button>
              <button className="btn btn-primary col-auto pt-2 pb-2" onClick={this.save}>
                <span>{this.props.t("Apply")}</span>
              </button>
            </div>
            <textarea
              style={{ width: "100%", height: 150 }}
              value={this.state.query || ""}
              onChange={event => this.setState({ query: event.target.value })}
            />
          </div>
        </div>
        <div className="row pt-3 pb-3">
          <span className="font-weight-bold col-auto pr-0">Query Engine</span>
          <div className="btn-group compact ml-auto mr-3 font-weight-bold col">
            {_.map(["python", "numexpr"], value => (
              <button
                key={value}
                className={`btn btn-primary ${value === queryEngine ? "active" : ""} font-weight-bold`}
                onClick={value === queryEngine ? _.noop : updateEngine(value)}>
                {value}
              </button>
            ))}
          </div>
        </div>
        {(this.state.columnFilters || this.state.outlierFilters) && (
          <div className="row pb-5">
            <div className="col-md-6">
              <StructuredFilters
                prop="columnFilters"
                label={t("Column Filters")}
                filters={this.state.columnFilters}
                dropFilter={this.dropFilter}
              />
            </div>
            <div className="col-md-6">
              <StructuredFilters
                prop="outlierFilters"
                label={t("Outlier Filters")}
                filters={this.state.outlierFilters}
                dropFilter={this.dropFilter}
              />
            </div>
          </div>
        )}
        <div className="row">
          <div className="col-md-12">
            <QueryExamples />
          </div>
        </div>
        {this.state.contextVars && <ContextVariables contextVars={this.state.contextVars} />}
      </React.Fragment>
    );
  }
}
ReactFilterPanel.displayName = "ReactFilterPanel";
ReactFilterPanel.propTypes = {
  dataId: PropTypes.string.isRequired,
  updateSettings: PropTypes.func,
  hideSidePanel: PropTypes.func,
  t: PropTypes.func,
  queryEngine: PropTypes.string,
  setEngine: PropTypes.func,
};
const TranslateReactFilterPanel = withTranslation("filter")(ReactFilterPanel);
const ReduxFilterPanel = connect(
  ({ dataId, queryEngine }) => ({ dataId, queryEngine }),
  dispatch => ({
    hideSidePanel: () => dispatch({ type: "hide-side-panel" }),
    updateSettings: (settings, callback) => dispatch(updateSettings(settings, callback)),
    setEngine: engine => dispatch(setQueryEngine(engine)),
  })
)(TranslateReactFilterPanel);

export { TranslateReactFilterPanel as ReactFilterPanel, ReduxFilterPanel as FilterPanel };
