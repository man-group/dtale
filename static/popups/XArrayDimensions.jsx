import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import Select, { createFilter } from "react-select";

import { BouncerWrapper } from "../BouncerWrapper";
import { RemovableError } from "../RemovableError";
import * as actions from "../actions/dtale";
import { fetchJson } from "../fetcher";

class ReactXArrayDimensions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      xarrayDim: _.reduce(props.xarrayDim || {}, (res, v, k) => ({ ...res, [k]: { value: v } }), {}),
      coordinates: [],
      dimension: null,
      dimensionData: null,
      loadingCoordinates: false,
      loadingDimension: false,
    };
    this.viewDimension = this.viewDimension.bind(this);
    this.save = this.save.bind(this);
  }

  componentDidMount() {
    const { dataId } = this.props;
    this.setState({ loadingCoordinates: true });
    fetchJson(`/dtale/xarray-coordinates/${dataId}`, coordData => {
      if (coordData.error) {
        this.setState({
          loadingCoordinates: false,
          error: <RemovableError {...coordData} />,
        });
        return;
      }
      const firstDimension = _.get(coordData.data, "0.name");
      let callback = _.noop;
      if (firstDimension) {
        callback = () => this.viewDimension(firstDimension);
      }
      this.setState({ loadingCoordinates: false, coordinates: coordData.data }, callback);
    });
  }

  viewDimension(dimension) {
    const { dataId } = this.props;
    this.setState({ loadingDimension: true, dimension });
    fetchJson(`/dtale/xarray-dimension-values/${dataId}/${dimension}`, dimensionData => {
      if (dimensionData.error) {
        this.setState({ error: <RemovableError {...dimensionData} /> });
        return;
      }
      this.setState({
        loadingDimension: false,
        dimensionData: dimensionData.data,
      });
    });
  }

  save() {
    const { dataId, updateXArrayDim, propagateState } = this.props;
    const updatedSelection = _.reduce(
      this.state.xarrayDim,
      (res, v, prop) => _.assignIn(res, _.get(v, "value") ? { [prop]: v.value } : {}),
      {}
    );
    fetchJson(`/dtale/update-xarray-selection/${dataId}?selection=${JSON.stringify(updatedSelection)}`, data => {
      if (data.error) {
        this.setState({ error: <RemovableError {...data} /> });
      }
      updateXArrayDim(updatedSelection, () => propagateState({ refresh: true }));
    });
  }

  render() {
    const { xarrayDim, t } = this.props;
    const currSelections = xarrayDim;
    const updatedSelection = _.reduce(
      this.state.xarrayDim,
      (res, v, prop) => _.assignIn(res, _.get(v, "value") ? { [prop]: v.value } : {}),
      {}
    );
    const canSave = !_.isEqual(updatedSelection, currSelections);
    return [
      <div key="body" className="modal-body">
        {this.state.error}
        <BouncerWrapper showBouncer={this.state.loadingCoordinates}>
          <div className="row">
            <div className="col-md-12">
              <ul className="list-group">
                {_.map(this.state.coordinates, ({ name, count, dtype }) => (
                  <li
                    key={`dim-${name}`}
                    className={`list-group-item ${this.state.dimension === name ? "active" : "pointer"}`}
                    {...(this.state.dimension === name ? {} : { onClick: () => this.viewDimension(name) })}>
                    <div className="row">
                      <div className="col-md-6">
                        <span className="font-weight-bold" style={{ fontSize: "18px" }}>
                          {name}
                        </span>
                        <div>{`(${t("count")}: ${count}, ${t("dtype")}: ${dtype})`}</div>
                      </div>
                      <div className="col-md-6">
                        <BouncerWrapper showBouncer={this.state.loadingDimension && this.state.dimension === name}>
                          <Select
                            className="Select is-clearable is-searchable Select--single"
                            isDisabled={this.state.dimension !== name}
                            classNamePrefix="Select"
                            options={this.state.dimension === name ? this.state.dimensionData || [] : []}
                            getOptionLabel={_.property("value")}
                            getOptionValue={_.property("value")}
                            value={_.get(this.state.xarrayDim, name, null)}
                            onChange={selected =>
                              this.setState({
                                xarrayDim: {
                                  ...this.state.xarrayDim,
                                  [name]: selected,
                                },
                              })
                            }
                            noOptionsText={() => t("No dimensions found")}
                            isClearable
                            filterOption={createFilter({
                              ignoreAccents: false,
                            })} // required for performance reasons!
                          />
                        </BouncerWrapper>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </BouncerWrapper>
      </div>,
      <div key="footer" className="modal-footer">
        <button className="btn btn-primary" disabled={!canSave} onClick={this.save}>
          <span>{t("Update Dimensions")}</span>
        </button>
      </div>,
    ];
  }
}
ReactXArrayDimensions.displayName = "XArrayDimensions";
ReactXArrayDimensions.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
  }),
  propagateState: PropTypes.func,
  xarrayDim: PropTypes.object,
  dataId: PropTypes.string.isRequired,
  updateXArrayDim: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactXArrayDimensions = withTranslation("xarray")(ReactXArrayDimensions);
const ReduxXArrayDimensions = connect(
  state => _.pick(state, ["chartData", "xarrayDim"]),
  dispatch => ({
    updateXArrayDim: (xarrayDim, callback) => dispatch(actions.updateXArrayDim(xarrayDim, callback)),
  })
)(TranslateReactXArrayDimensions);

export { TranslateReactXArrayDimensions as ReactXArrayDimensions, ReduxXArrayDimensions as XArrayDimensions };
