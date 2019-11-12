import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import ConditionalRender from "../ConditionalRender";
import { RemovableError } from "../RemovableError";

function hasNoInfo({ selectedCols, sortInfo, query }) {
  return _.isEmpty(selectedCols) && _.isEmpty(sortInfo) && _.isEmpty(query);
}

class DataViewerInfo extends React.Component {
  render() {
    const { error, propagateState } = this.props;
    if (error) {
      return (
        <div style={{ width: this.props.width || "100%" }} className="row">
          <div className="col-md-12">
            <RemovableError {...this.props} onRemove={() => propagateState({ error: null, traceback: null })} />
          </div>
        </div>
      );
    }
    const hideSelected = _.isEmpty(this.props.selectedCols);
    const hideSort = _.isEmpty(this.props.sortInfo);
    const hideFilter = _.isEmpty(this.props.query);
    if (hideSelected && hideSort && hideFilter) {
      return null;
    }
    return (
      <div style={{ width: this.props.width || "100%" }} className="row text-center">
        <div className="col-md-4">
          <ConditionalRender display={!hideSelected}>
            <div className="font-weight-bold d-inline-block">Selected:</div>
            <div className="pl-3 d-inline-block">{_.join(this.props.selectedCols, ", ")}</div>
            <i
              className="ico-cancel pl-3"
              style={{ marginTop: "-0.1em" }}
              onClick={() => this.props.propagateState({ selectedCols: [] })}
            />
          </ConditionalRender>
        </div>
        <div className="col-md-4">
          <ConditionalRender display={!hideSort}>
            <div className="font-weight-bold d-inline-block">Sort:</div>
            <div className="pl-3 d-inline-block">
              {_.join(_.map(this.props.sortInfo, ([col, dir]) => `${col} (${dir})`), ", ")}
            </div>
            <i
              className="ico-cancel pl-3"
              style={{ marginTop: "-0.1em" }}
              onClick={() => this.props.propagateState({ sortInfo: [] })}
            />
          </ConditionalRender>
        </div>
        <div className="col-md-4">
          <ConditionalRender display={!hideFilter}>
            <div className="font-weight-bold d-inline-block">Filter:</div>
            <div className="pl-3 d-inline-block">{this.props.query}</div>
            <i
              className="ico-cancel pl-3"
              style={{ marginTop: "-0.1em" }}
              onClick={() => this.props.propagateState({ query: "" })}
            />
          </ConditionalRender>
        </div>
      </div>
    );
  }
}
DataViewerInfo.displayName = "DataViewerInfo";
DataViewerInfo.propTypes = {
  sortInfo: PropTypes.array,
  selectedCols: PropTypes.array,
  query: PropTypes.string,
  propagateState: PropTypes.func,
  error: PropTypes.string,
  width: PropTypes.number,
};

export { DataViewerInfo, hasNoInfo };
