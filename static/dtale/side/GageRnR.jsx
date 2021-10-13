import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import Column from "react-virtualized/dist/commonjs/Table/Column";
import Table from "react-virtualized/dist/commonjs/Table/Table";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { dtypesUrl, gageUrl } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import { FilterableToggle } from "../../popups/FilterableToggle";
import ColumnSelect from "../../popups/create/ColumnSelect";
import * as gu from "../gridUtils";

require("./GageRnR.css");

class ReactGageRnR extends React.Component {
  constructor(props) {
    super(props);
    const hasFilters = gu.noFilters(props.settings);
    this.state = {
      loadingDtypes: true,
      dtypes: null,
      operator: null,
      measurements: null,
      hasFilters: !hasFilters,
      filtered: !hasFilters,
      loadingReport: false,
    };
    this.loadReport = this.loadReport.bind(this);
  }

  componentDidMount() {
    fetchJson(dtypesUrl(this.props.dataId), dtypesData => {
      const newState = { error: null, loadingDtypes: false };
      if (dtypesData.error) {
        this.setState({
          error: <RemovableError {...dtypesData} />,
          loadingDtypes: false,
        });
        return;
      }
      newState.dtypes = dtypesData.dtypes;
      this.setState(newState);
    });
  }

  loadReport(state) {
    const { dataId } = this.props;
    const newState = { ...this.state, ...state, loadingReport: true };
    const operator = (newState.operator ?? []).map(o => o.value);
    const measurements = (newState.measurements ?? []).map(o => o.value);
    if (!operator.length) {
      this.setState({ ...newState, loadingReport: false });
      return;
    }
    this.setState({ ...newState, loadingReport: true });
    const url = gageUrl(dataId, JSON.stringify(operator), JSON.stringify(measurements), newState.filterable);
    fetchJson(url, reportData => {
      if (reportData.error) {
        this.setState({
          error: <RemovableError {...reportData} />,
          loadingReport: false,
        });
        return;
      }
      this.setState({ ...reportData, loadingReport: false });
    });
  }

  render() {
    const { t } = this.props;
    return (
      <>
        {this.state.error}
        <div className="row ml-0 mr-0">
          <div className="col-auto pl-0">
            <h2>{t("gage_rnr", { ns: "menu" })}</h2>
          </div>
          <div className="col" />
          <FilterableToggle {...this.state} propagateState={state => this.loadReport(state)} />
          <div className="col-auto">
            <button className="btn btn-plain" onClick={this.props.hideSidePanel}>
              <i className="ico-close pointer" title={t("side:Close")} />
            </button>
          </div>
        </div>
        <BouncerWrapper showBouncer={this.state.loadingDtypes}>
          <div className="row ml-0 mr-0 missingno-inputs">
            <div className="col-md-12">
              <ColumnSelect
                isMulti={true}
                label={t("gage_rnr:Operator")}
                prop="operator"
                otherProps={["measurements"]}
                parent={this.state}
                updateState={state => this.loadReport(state)}
                columns={this.state.dtypes}
              />
            </div>
          </div>
          <div className="row ml-0 mr-0 missingno-inputs">
            <div className="col-md-12">
              <ColumnSelect
                isMulti={true}
                label={t("gage_rnr:Measurements")}
                prop="measurements"
                otherProps={["operator"]}
                parent={this.state}
                updateState={state => this.loadReport(state)}
                columns={this.state.dtypes}
              />
            </div>
          </div>
          <BouncerWrapper showBouncer={this.state.loadingReport}>
            {!_.isEmpty(this.state.operator) && !_.isEmpty(this.state.results) && (
              <>
                <div className="gage-report-div">
                  <AutoSizer>
                    {({ width }) => (
                      <Table
                        height={175}
                        rowStyle={{ display: "flex" }}
                        headerHeight={gu.ROW_HEIGHT}
                        headerClassName="headerCell"
                        rowHeight={gu.ROW_HEIGHT}
                        rowGetter={({ index }) => this.state.results[index]}
                        rowCount={_.size(this.state.results)}
                        width={width}
                        className="gage-report">
                        {_.map(this.state.columns, ({ name }, idx) => (
                          <Column
                            key={name}
                            dataKey={name}
                            label={name}
                            style={{ textAlign: "center" }}
                            width={idx === 0 ? 300 : 200}
                            flexGrow={idx === 0 ? 1 : 0}
                            className="cell"
                          />
                        ))}
                      </Table>
                    )}
                  </AutoSizer>
                </div>
                <p>{t("menu_description:gage_rnr")}</p>
              </>
            )}
            {!_.isEmpty(this.state.operator) && _.isEmpty(this.state.results) && <h3>No results found!</h3>}
          </BouncerWrapper>
        </BouncerWrapper>
      </>
    );
  }
}
ReactGageRnR.displayName = "ReactGageRnR";
ReactGageRnR.propTypes = {
  dataId: PropTypes.string,
  hideSidePanel: PropTypes.func,
  t: PropTypes.func,
  settings: PropTypes.object,
};

const TranslatedGageRnR = withTranslation(["side", "menu", "menu_description", "gage_rnr"])(ReactGageRnR);
const ReduxGageRnR = connect(
  ({ dataId, settings }) => ({ dataId, settings }),
  dispatch => ({ hideSidePanel: () => dispatch({ type: "hide-side-panel" }) })
)(TranslatedGageRnR);
export { TranslatedGageRnR as ReactGageRnR, ReduxGageRnR as GageRnR };
