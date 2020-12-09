import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { Bouncer } from "../../Bouncer";
import { JSAnchor } from "../../JSAnchor";
import { RemovableError } from "../../RemovableError";
import { buildURLString, saveColFilterUrl } from "../../actions/url-utils";
import { exports as gu } from "../../dtale/gridUtils";
import { fetchJson } from "../../fetcher";
import { buildButton } from "../../toggleUtils";
import DetailsCharts from "./DetailsCharts";

const BASE_DESCRIBE_URL = "/dtale/describe";

function displayUniques(uniques, dtype = null, baseTitle = "Unique") {
  if (_.isEmpty(uniques.data)) {
    return null;
  }
  let title = `${baseTitle} Values`;
  if (dtype) {
    title = `${title} of type '${dtype}'`;
  }
  if (uniques.top) {
    title = `${title} (top 100 most common)`;
  }
  return (
    <div key={dtype} className="row">
      <div className="col-sm-12">
        <span className="font-weight-bold" style={{ fontSize: "120%" }}>
          {`${title}:`}
        </span>
        <br />
        <span>
          {_.join(
            _.map(uniques.data, u => `${u.value} (${u.count})`),
            ", "
          )}
        </span>
      </div>
    </div>
  );
}

class Details extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      details: null,
      deepData: "uniques",
      outliers: null,
      loadingOutliers: false,
    };
    this.loadDetails = this.loadDetails.bind(this);
    this.renderUniques = this.renderUniques.bind(this);
    this.renderDeepDataToggle = this.renderDeepDataToggle.bind(this);
    this.loadOutliers = this.loadOutliers.bind(this);
    this.renderOutliers = this.renderOutliers.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props.selected, prevProps.selected)) {
      this.loadDetails();
    }
  }

  loadDetails() {
    fetchJson(`${BASE_DESCRIBE_URL}/${this.props.dataId}/${this.props.selected.name}`, detailData => {
      const newState = {
        error: null,
        details: null,
        code: null,
        outliers: null,
        deepData: "uniques",
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

    const uniques = _.get(this.state, "details.uniques") || {};
    const dtypeCt = _.size(uniques);
    return _.map(uniques, (dtypeUniques, dtype) => displayUniques(dtypeUniques, dtypeCt > 1 ? dtype : null));
  }

  renderDiffs() {
    if (this.state.deepData !== "diffs") {
      return null;
    }

    const diffs = _.get(this.state, "details.sequential_diffs.diffs") || {};
    return displayUniques(diffs, null, "Sequential Difference");
  }

  loadOutliers() {
    this.setState({ loadingOutliers: true });
    fetchJson(`/dtale/outliers/${this.props.dataId}/${this.props.selected.name}`, outlierData => {
      this.setState({ outliers: outlierData, loadingOutliers: false });
    });
  }

  renderDeepDataToggle() {
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
              <button {...buildButton(deepData === "uniques", toggle("uniques"))}>Uniques</button>
              <button {...buildButton(deepData === "outliers", toggle("outliers"))}>Outliers</button>
              <button {...buildButton(deepData === "diffs", toggle("diffs"))}>Diffs</button>
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
              <button {...buildButton(deepData === "uniques", toggle("uniques"))}>Uniques</button>
              <button {...buildButton(deepData === "diffs", toggle("diffs"))}>Diffs</button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  renderOutliers() {
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
              No Outliers Detected
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
      const url = buildURLString(saveColFilterUrl(this.props.dataId, this.props.selected.name), {
        cfg: JSON.stringify(cfg),
      });
      this.setState(
        {
          outliers: _.assignIn({}, outliers, {
            queryApplied: !outliers.queryApplied,
          }),
        },
        fetchJson(url, () => window.opener.location.reload())
      );
    };
    return [
      <div key={1} className="row">
        <div className="col">
          <span className="font-weight-bold" style={{ fontSize: "120%" }}>
            {`${_.size(outlierValues)} Outliers Found${outliers.top ? " (top 100)" : ""}:`}
          </span>
          <JSAnchor onClick={saveFilter} className="d-block">
            <span className="pr-3">{`${outliers.queryApplied ? "Remove" : "Apply"} outlier filter:`}</span>
            <span className="font-weight-bold">{outliers.query}</span>
          </JSAnchor>
        </div>
        <div className="col-auto">
          <div className="hoverable" style={{ borderBottom: "none" }}>
            <i className="ico-code pr-3" />
            <span>View Code</span>
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
          </div>
        </div>
        <DetailsCharts
          details={details}
          detailCode={code}
          dtype={details.dtype}
          cols={dtypes}
          col={selected.name}
          dataId={dataId}
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
};

export { Details };
