import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

const BASE_STATE = {
  isEquals: false,
  equals: null,
  isGreaterThan: false,
  greaterThan: null,
  isLessThan: false,
  lessThan: null,
};

const MODES = [
  ["Equals", "isEquals", "equals", (val, equals) => val === equals],
  ["Greater Than", "isGreaterThan", "greaterThan", (val, greaterThan) => val > greaterThan],
  ["Less Than", "isLessThan", "lessThan", (val, lessThan) => val < lessThan],
];

class ReactRangeHighlight extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ..._.get(props, "chartData.rangeHighlight", BASE_STATE) };
    _.forEach(MODES, ([_label, _flag, value, _filter]) => {
      if (!_.isNil(this.state[value])) {
        this.state[value] = this.state[value] + "";
      }
    });
    this.updateHighlights = this.updateHighlights.bind(this);
  }

  updateHighlights(state) {
    const updatedState = _.assignIn({}, this.state, state);
    const rangeHighlight = { ...updatedState };
    let backgroundMode = {};
    _.forEach(MODES, ([_label, flag, value, _filter]) => {
      if (updatedState[flag] && !_.isNil(updatedState[value])) {
        rangeHighlight[value] = parseFloat(rangeHighlight[value]);
        backgroundMode = { backgroundMode: "range", triggerBgResize: true };
      }
    });
    if (_.get(this.props, "chartData.backgroundMode") === "range" && !_.has(backgroundMode, "backgroundMode")) {
      backgroundMode.backgroundMode = null;
    }
    this.setState(updatedState, () => this.props.propagateState({ ...backgroundMode, rangeHighlight }));
  }

  render() {
    return (
      <div key="body" className="modal-body">
        {_.map(MODES, ([label, flag, value, _filter], i) => (
          <div key={i} className="form-group row">
            <label className="col-md-4 col-form-label text-right">
              <i
                className={`ico-check-box${this.state[flag] ? "" : "-outline-blank"} pointer mr-3 float-left`}
                onClick={() => this.updateHighlights({ [flag]: !this.state[flag] })}
              />
              {label}
            </label>
            <div className="col-md-7">
              <input
                type="number"
                disabled={!this.state[flag]}
                className="form-control"
                value={this.state[value] || ""}
                onChange={e => this.updateHighlights({ [value]: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
}
ReactRangeHighlight.displayName = "RangeHighlight";
ReactRangeHighlight.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    rangeHighlight: PropTypes.object,
    backgroundMode: PropTypes.string,
  }),
  propagateState: PropTypes.func,
};

const ReduxRangeHighlight = connect(state => _.pick(state, ["chartData"]))(ReactRangeHighlight);

export { ReactRangeHighlight, ReduxRangeHighlight as RangeHighlight, MODES };
