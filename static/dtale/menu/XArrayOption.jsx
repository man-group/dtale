import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { openChart } from "../../actions/charts";
import Descriptions from "../menu-descriptions.json";

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
  }

  render() {
    const openXArrayPopup = type => this.props.openChart(_.assignIn({ type }, this.props));
    if (this.props.xarray) {
      return (
        <li className="hoverable">
          <span className="toggler-action">
            <button className="btn btn-plain" onClick={() => openXArrayPopup("xarray-dimensions")}>
              <i className="ico-key" />
              <span className="font-weight-bold">XArray Dimensions</span>
            </button>
          </span>
          <div className="hoverable__content menu-description">
            {`${DESCRIPTION} ${renderDimensionSelection(this.props.xarrayDim)}`}
          </div>
        </li>
      );
    }
    return (
      <li className="hoverable">
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={() => openXArrayPopup("xarray-indexes")}>
            <i className="ico-tune" />
            <span className="font-weight-bold">Convert To XArray</span>
          </button>
        </span>
        <div className="hoverable__content menu-description">{Descriptions.xarray_conversion}</div>
      </li>
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
