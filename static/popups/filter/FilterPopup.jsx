import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { Bouncer } from "../../Bouncer";
import { RemovableError } from "../../RemovableError";
import { closeChart } from "../../actions/charts";
import { setQueryEngine } from "../../actions/dtale";
import { updateSettings } from "../../actions/settings";
import serverState from "../../dtale/serverStateManagement";
import ContextVariables from "./ContextVariables";
import PandasQueryHelp from "./PandasQueryHelp";
import QueryExamples from "./QueryExamples";
import StructuredFilters from "./StructuredFilters";
import { loadInfo, saveFilter } from "./filterUtils";

class ReactFilterPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = { query: "", error: null };
    this.save = this.save.bind(this);
    this.dropFilter = this.dropFilter.bind(this);
    this.clear = this.clear.bind(this);
    this.renderBody = this.renderBody.bind(this);
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
      if (_.startsWith(window.location.pathname, "/dtale/popup/filter")) {
        window.opener.location.reload();
        window.close();
      } else {
        this.props.updateSettings({ query: this.state.query }, this.props.onClose);
      }
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
      if (_.startsWith(window.location.pathname, "/dtale/popup/filter")) {
        window.opener.location.reload();
      } else {
        this.props.updateSettings(updatedSettings, () => this.setState(updatedSettings));
      }
    });
  }

  clear() {
    serverState.updateSettings({ query: "" }, this.props.dataId, () => {
      if (_.startsWith(window.location.pathname, "/dtale/popup/filter")) {
        window.opener.location.reload();
        window.close();
      } else {
        this.props.updateSettings({ query: "" }, this.props.onClose);
      }
    });
  }

  renderBody() {
    if (this.state.loading) {
      return <Bouncer />;
    }
    const { t, queryEngine, setEngine } = this.props;
    const updateEngine = engine => () => serverState.updateQueryEngine(engine, () => setEngine(engine));
    return (
      <React.Fragment>
        <RemovableError {...this.state} onRemove={() => this.setState({ error: null, traceback: null })} />
        <div className="row">
          <div className="col-md-7">
            <div className="row h-100">
              <div className="col-md-12 h-100">
                <StructuredFilters
                  prop="columnFilters"
                  label={t("Column Filters")}
                  filters={this.state.columnFilters}
                  dropFilter={this.dropFilter}
                />
                <StructuredFilters
                  prop="outlierFilters"
                  label={t("Outlier Filters")}
                  filters={this.state.outlierFilters}
                  dropFilter={this.dropFilter}
                />
                <div className="font-weight-bold pt-3 pb-3">{t("Custom Filter")}</div>
                <textarea
                  style={{ width: "100%", height: 150 }}
                  value={this.state.query || ""}
                  onChange={event => this.setState({ query: event.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <QueryExamples />
          </div>
        </div>
        <div className="row pb-0">
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
        <div className="row">
          <div className="col-md-12">
            {this.state.contextVars && <ContextVariables contextVars={this.state.contextVars} />}
          </div>
        </div>
      </React.Fragment>
    );
  }

  render() {
    return (
      <React.Fragment>
        <div className="modal-body filter-modal">{this.renderBody()}</div>
        <div className="modal-footer">
          <PandasQueryHelp />
          <button className="btn btn-primary" onClick={this.clear}>
            <span>{this.props.t("Clear")}</span>
          </button>
          <button className="btn btn-primary" onClick={this.save}>
            <span>{this.props.t("Apply")}</span>
          </button>
        </div>
      </React.Fragment>
    );
  }
}
ReactFilterPopup.displayName = "ReactFilterPopup";
ReactFilterPopup.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
  }),
  onClose: PropTypes.func,
  updateSettings: PropTypes.func,
  t: PropTypes.func,
  queryEngine: PropTypes.string,
  setEngine: PropTypes.func,
};
const TranslateReactFilterPopup = withTranslation("filter")(ReactFilterPopup);
const ReduxFilterPopup = connect(
  state => _.pick(state, ["dataId", "chartData", "queryEngine"]),
  dispatch => ({
    onClose: chartData => dispatch(closeChart(chartData || {})),
    updateSettings: (settings, callback) => dispatch(updateSettings(settings, callback)),
    setEngine: engine => dispatch(setQueryEngine(engine)),
  })
)(TranslateReactFilterPopup);

export { TranslateReactFilterPopup as ReactFilterPopup, ReduxFilterPopup as FilterPopup };
