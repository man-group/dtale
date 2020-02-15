import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import ConditionalRender from "../ConditionalRender";
import { RemovableError } from "../RemovableError";
import * as gu from "./gridUtils";
import serverState from "./serverStateManagement";

class ReactDataViewerInfo extends React.Component {
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
    const hideSort = _.isEmpty(this.props.sortInfo);
    const hideFilter = _.isEmpty(this.props.query);
    const hideHidden = gu.noHidden(this.props.columns);
    if (hideSort && hideFilter && hideHidden) {
      return null;
    }
    const hidden = _.map(_.filter(this.props.columns, { visible: false }), "name");
    let hiddenText = _.join(hidden, ", ");
    if (_.size(hiddenText) > 30) {
      hiddenText = `${_.size(hidden)} Columns`;
    }
    const unhide = () => {
      const visibility = _.reduce(this.props.columns, (ret, { name }) => _.assignIn(ret, { [name]: true }), {});
      const updatedColumns = _.map(this.props.columns, c => _.assignIn({}, c, { visible: true }));
      serverState.updateVisibility(this.props.dataId, visibility, () =>
        this.props.propagateState({ columns: updatedColumns })
      );
    };
    return (
      <div style={{ width: this.props.width || "100%" }} className="row text-center">
        <div className="col-md-4">
          <ConditionalRender display={!hideSort}>
            <div className="font-weight-bold d-inline-block">Sort:</div>
            <div className="pl-3 d-inline-block">
              {_.join(
                _.map(this.props.sortInfo, ([col, dir]) => `${col} (${dir})`),
                ", "
              )}
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
        <div className="col-md-4">
          <ConditionalRender display={!hideHidden}>
            <div className="font-weight-bold d-inline-block">Hidden:</div>
            <div className="pl-3 d-inline-block">{hiddenText}</div>
            <i className="ico-cancel pl-3" style={{ marginTop: "-0.1em" }} onClick={unhide} />
          </ConditionalRender>
        </div>
      </div>
    );
  }
}
ReactDataViewerInfo.displayName = "DataViewerInfo";
ReactDataViewerInfo.propTypes = {
  sortInfo: PropTypes.array,
  query: PropTypes.string,
  propagateState: PropTypes.func,
  error: PropTypes.string,
  width: PropTypes.number,
  columns: PropTypes.arrayOf(PropTypes.object),
  dataId: PropTypes.string,
};

const ReduxDataViewerInfo = connect(({ dataId }) => ({ dataId }))(ReactDataViewerInfo);
export { ReduxDataViewerInfo as DataViewerInfo, ReactDataViewerInfo };
