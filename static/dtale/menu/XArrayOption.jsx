import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { openChart } from "../../actions/charts";
import Descriptions from "../menu-descriptions.json";
import { MenuItem } from "./MenuItem";

const DESCRIPTION = "View individual xarray dimensions. You are currently viewing:";

function renderDimensionSelection(dimensionSelection) {
  if (_.size(dimensionSelection)) {
    return _.join(
      _.map(dimensionSelection, (val, prop) => `${val} (${prop})`),
      ", "
    );
  }
  return "ALL DATA";
}

class ReactXArrayOption extends React.Component {
  constructor(props) {
    super(props);
    this.buttonRef = React.createRef();
  }

  render() {
    const openXArrayPopup = type => this.props.openChart(_.assignIn({ type }, this.props));
    if (this.props.xarray) {
      return (
        <MenuItem description={`${DESCRIPTION} ${renderDimensionSelection(this.props.xarrayDim)}`}>
          <span className="toggler-action">
            <button className="btn btn-plain" onClick={() => openXArrayPopup("xarray-dimensions")}>
              <i className="ico-key" />
              <span className="font-weight-bold">XArray Dimensions</span>
            </button>
          </span>
        </MenuItem>
      );
    }
    return (
      <MenuItem description={Descriptions.xarray_conversion}>
        <span className="toggler-action">
          <button className="btn btn-plain" ref={this.buttonRef} onClick={() => openXArrayPopup("xarray-indexes")}>
            <i className="ico-tune" />
            <span className="font-weight-bold">Convert To XArray</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
ReactXArrayOption.displayName = "ReactXArrayOption";
ReactXArrayOption.propTypes = {
  columns: PropTypes.array, // eslint-disable-line react/no-unused-prop-types
  xarray: PropTypes.bool,
  xarrayDim: PropTypes.object,
  openChart: PropTypes.func,
};

const ReduxXArrayOption = connect(
  state => _.pick(state, ["xarray", "xarrayDim"]),
  dispatch => ({ openChart: chartProps => dispatch(openChart(chartProps)) })
)(ReactXArrayOption);

export { ReduxXArrayOption as XArrayOption, ReactXArrayOption };
