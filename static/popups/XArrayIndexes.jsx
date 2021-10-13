import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import Select, { createFilter } from "react-select";

import { RemovableError } from "../RemovableError";
import * as actions from "../actions/dtale";
import { fetchJson } from "../fetcher";

class ReactXArrayIndexes extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: _.map(_.filter(props.chartData.columns, "locked"), l => ({
        value: l.name,
      })),
    };
    this.convert = this.convert.bind(this);
  }

  convert() {
    const { dataId, propagateState, convertToXArray } = this.props;
    const columns = _.get(this.props, "chartData.columns", []);
    const { index } = this.state;
    fetchJson(`/dtale/to-xarray/${dataId}?index=${JSON.stringify(_.map(index, "value"))}`, data => {
      if (data.error) {
        this.setState({ error: <RemovableError {...data} /> });
      }
      const newState = { refresh: true };
      if (_.find(this.state.index, i => _.find(columns, { name: i.value, locked: false }))) {
        newState.columns = _.map(columns, c => ({
          ...c,
          locked: !_.isUndefined(_.find(index, { value: c.name })),
        }));
      }
      convertToXArray(() => propagateState(newState));
    });
  }

  render() {
    const options = _.sortBy(
      _.map(this.props.chartData.columns, c => ({ value: c.name })),
      ({ value }) => _.toLower(value)
    );
    return [
      <div key="body" className="modal-body">
        {this.state.error}
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{this.props.t("Index", { ns: "menu" })}</label>
          <div className="col-md-8">
            <div className="input-group">
              <Select
                className="Select is-clearable is-searchable Select--single"
                classNamePrefix="Select"
                options={options}
                getOptionLabel={_.property("value")}
                getOptionValue={_.property("value")}
                value={this.state.index}
                onChange={index => this.setState({ index })}
                noOptionsText={() => this.props.t("No columns found", { ns: "correlations" })}
                isClearable
                isMulti
                filterOption={createFilter({
                  ignoreAccents: false,
                })} // required for performance reasons!
              />
            </div>
          </div>
        </div>
      </div>,
      <div key="footer" className="modal-footer">
        <button className="btn btn-primary" disabled={_.size(this.state.index) === 0} onClick={this.convert}>
          <span>{this.props.t("Convert To XArray", { ns: "menu" })}</span>
        </button>
      </div>,
    ];
  }
}
ReactXArrayIndexes.displayName = "XArrayIndexes";
ReactXArrayIndexes.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    columns: PropTypes.arrayOf(PropTypes.object),
  }),
  propagateState: PropTypes.func,
  dataId: PropTypes.string.isRequired,
  convertToXArray: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactXArrayIndexes = withTranslation(["menu", "correlations"])(ReactXArrayIndexes);
const ReduxXArrayIndexes = connect(
  state => _.pick(state, ["chartData"]),
  dispatch => ({
    convertToXArray: callback => dispatch(actions.convertToXArray(callback)),
  })
)(TranslateReactXArrayIndexes);

export { TranslateReactXArrayIndexes as ReactXArrayIndexes, ReduxXArrayIndexes as XArrayIndexes };
