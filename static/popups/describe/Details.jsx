import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { Bouncer } from "../../Bouncer";
import { JSAnchor } from "../../JSAnchor";
import { RemovableError } from "../../RemovableError";
import * as actions from "../../actions/dtale";
import { buildURLString, describeUrl, outliersUrl, toggleOutlierFilterUrl } from "../../actions/url-utils";
import * as gu from "../../dtale/gridUtils";
import { fetchJson } from "../../fetcher";
import { buildButton } from "../../toggleUtils";
import { FilterableToggle } from "../FilterableToggle";
import DetailsCharts from "./DetailsCharts";
import Uniques from "./Uniques";

class Details extends React.Component {
  constructor(props) {
    super(props);
    const hasFilters = gu.noFilters(props.settings);
    this.state = {
      error: null,
      details: null,
      deepData: "uniques",
      viewWordValues: false,
      wordValues: null,
      outliers: null,
      loadingOutliers: false,
      hasFilters: !hasFilters,
      filtered: !hasFilters,
    };
    this.loadDetails = this.loadDetails.bind(this);
    this.renderUniques = this.renderUniques.bind(this);
    this.renderDeepDataToggle = this.renderDeepDataToggle.bind(this);
    this.loadOutliers = this.loadOutliers.bind(this);
    this.renderOutliers = this.renderOutliers.bind(this);
    this.propagateState = state => this.setState(state);
  }

  componentDidMount() {
    if (this.props.selected) {
      this.loadDetails();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(this.props.selected, prevProps.selected) || this.state.filtered !== prevState.filtered) {
      this.loadDetails();
    }
  }

  loadDetails() {
    fetchJson(describeUrl(this.props.dataId, this.props.selected.name, this.state.filtered), detailData => {
      const newState = {
        error: null,
        details: null,
        code: null,
        outliers: null,
        deepData: "uniques",
        viewWordValues: false,
        wordValues: null,
      };
      if (detailData.error) {
        newState.error = (
          <div className="col-md-12">
            <RemovableError {...detailData} />
          </div>
        );
        this.setState(newState);
        return;
      }
      const detailProps = ["describe", "uniques", "dtype_counts", "sequential_diffs", "string_metrics"];
      newState.details = _.pick(detailData, detailProps);
      newState.details.name = this.props.selected.name;
      newState.details.dtype = this.props.selected.dtype;
      newState.code = detailData.code;
      this.setState(newState);
    });
  }

  renderUniques() {
    if (this.state.deepData !== "uniques") {
      return null;
    }
    if (this.state.viewWordValues) {
      const { wordValues } = this.state;
      return <Uniques uniques={{ data: wordValues }} baseTitle="Word" />;
    }
    const uniques = _.get(this.state, "details.uniques") || {};
    const dtypeCt = _.size(uniques);
    return _.map(uniques, (dtypeUniques, dtype) => (
      <Uniques key={dtype} uniques={dtypeUniques} dtype={dtypeCt > 1 ? dtype : null} />
    ));
  }

  renderDiffs() {
    if (this.state.deepData !== "diffs") {
      return null;
    }

    const diffs = _.get(this.state, "details.sequential_diffs.diffs") || {};
    return <Uniques uniques={diffs} baseTitle="Sequential Difference" />;
  }

  loadOutliers() {
    this.setState({ loadingOutliers: true });
    fetchJson(outliersUrl(this.props.dataId, this.props.selected.name), outlierData => {
      this.setState({ outliers: outlierData, loadingOutliers: false });
    });
  }

  renderDeepDataToggle() {
    const { t } = this.props;
    const { deepData } = this.state;
    const colType = gu.findColType(this.props.selected.dtype);
    if (_.includes(["float", "int"], colType)) {
      const { outliers, loadingOutliers } = this.state;
      const toggle = val => () => {
        const outliersCallback =
          _.isNull(outliers) && val === "outliers" && !loadingOutliers ? this.loadOutliers : _.noop;
        this.setState({ deepData: val }, outliersCallback);
      };
      return (
        <div className="row pb-5">
          <div className="col-auto pl-0">
            <div className="btn-group compact col-auto">
              <button {...buildButton(deepData === "uniques", toggle("uniques"))}>{t("Uniques")}</button>
              <button {...buildButton(deepData === "outliers", toggle("outliers"))}>{t("Outliers")}</button>
              <button {...buildButton(deepData === "diffs", toggle("diffs"))}>{t("Diffs")}</button>
            </div>
          </div>
        </div>
      );
    } else if (colType === "date") {
      const toggle = val => () => this.setState({ deepData: val });
      return (
        <div className="row pb-5">
          <div className="col-auto pl-0">
            <div className="btn-group compact col-auto">
              <button {...buildButton(deepData === "uniques", toggle("uniques"))}>{t("Uniques")}</button>
              <button {...buildButton(deepData === "diffs", toggle("diffs"))}>{t("Diffs")}</button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  renderOutliers() {
    const { t } = this.props;
    if (this.state.deepData !== "outliers") {
      return null;
    }
    if (this.state.loadingOutliers) {
      return <Bouncer />;
    }
    const { outliers } = this.state;
    const outlierValues = _.get(outliers, "outliers", []);
    if (_.isEmpty(outlierValues)) {
      return (
        <div key={3} className="row">
          <div className="col-sm-12">
            <span className="font-weight-bold" style={{ fontSize: "120%" }}>
              {t("No Outliers Detected")}
            </span>
          </div>
        </div>
      );
    }
    const saveFilter = () => {
      const cfg = { type: "outliers" };
      if (!outliers.queryApplied) {
        cfg.query = outliers.query;
      }
      const url = buildURLString(toggleOutlierFilterUrl(this.props.dataId), {
        col: this.props.selected.name,
      });
      this.setState(
        {
          outliers: _.assignIn({}, outliers, {
            queryApplied: !outliers.queryApplied,
          }),
        },
        fetchJson(url, ({ outlierFilters }) => {
          this.props.updateSettings({ outlierFilters });
          if (actions.isPopup()) {
            window.opener.location.reload();
          }
        })
      );
    };
    return [
      <div key={1} className="row">
        <div className="col">
          <span className="font-weight-bold" style={{ fontSize: "120%" }}>
            {`${_.size(outlierValues)} ${t("Outliers Found")}${outliers.top ? ` (${t("top 100")})` : ""}:`}
          </span>
          <JSAnchor onClick={saveFilter} className="d-block">
            <span className="pr-3">{`${outliers.queryApplied ? "Remove" : "Apply"} outlier filter:`}</span>
            <span className="font-weight-bold">{outliers.query}</span>
          </JSAnchor>
        </div>
        <div className="col-auto">
          <div className="hoverable" style={{ borderBottom: "none" }}>
            <i className="ico-code pr-3" />
            <span>{t("View Code")}</span>
            <div className="hoverable__content" style={{ width: "auto" }}>
              <pre className="mb-0">{outliers.code}</pre>
            </div>
          </div>
        </div>
      </div>,
      <div key={2} className="row">
        <div className="col-sm-12">
          <span>{_.join(_.sortBy(outlierValues), ", ")}</span>
        </div>
      </div>,
    ];
  }

  render() {
    if (this.state.error) {
      return (
        <div key={1} className="row">
          <div className="col-sm-12">{this.state.error}</div>
        </div>
      );
    }
    const { details, code } = this.state;
    if (_.isEmpty(details)) {
      return null;
    }
    const { dtypes, selected, dataId } = this.props;
    return (
      <React.Fragment>
        <div className="row">
          <div className="col">
            <span className="mb-0 font-weight-bold" style={{ fontSize: "2em" }}>
              {details.name}
            </span>
            <span className="pl-3">({details.dtype})</span>
            <small className="d-block pl-2 pb-3" style={{ marginTop: "-8px" }}>
              ({this.props.t("navigate")})
            </small>
          </div>
          <FilterableToggle {...this.state} propagateState={state => this.setState(state)} className="pr-0" />
          {this.props.close}
        </div>
        <DetailsCharts
          details={details}
          detailCode={code}
          dtype={details.dtype}
          cols={dtypes}
          col={selected.name}
          dataId={dataId}
          propagateState={this.propagateState}
          filtered={this.state.filtered}
        />
        {this.renderDeepDataToggle()}
        {this.renderUniques()}
        {this.renderDiffs()}
        {this.renderOutliers()}
      </React.Fragment>
    );
  }
}
Details.displayName = "Details";
Details.propTypes = {
  selected: PropTypes.object,
  dataId: PropTypes.string,
  dtypes: PropTypes.array,
  close: PropTypes.node,
  updateSettings: PropTypes.func,
  t: PropTypes.func,
  settings: PropTypes.object,
};
const TranslateDetails = withTranslation("describe")(Details);
const ReduxDetails = connect(({ settings }) => ({ settings }))(TranslateDetails);
export { TranslateDetails as ReactDetails, ReduxDetails as Details };
