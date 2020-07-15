import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";
import ReactSlider from "react-slider";
import styled from "styled-components";

require("./CreateWinsorize.css");

const StyledSlider = styled(ReactSlider)`
  width: 100%;
  height: 25px;
`;

const StyledThumb = styled.div`
  height: 25px;
  line-height: 25px;
  width: 25px;
  text-align: center;
  background-color: #000;
  color: #fff;
  border-radius: 50%;
  cursor: grab;
`;

const Thumb = (props, state) => <StyledThumb {...props}>{state.valueNow}</StyledThumb>;

const StyledTrack = styled.div`
  top: 0;
  bottom: 0;
  background: ${props => (props.index === 1 ? "#2a91d1" : "#ddd")};
  border-radius: 999px;
`;

const Track = (props, state) => <StyledTrack {...props} index={state.index} />;

function validateWinsorizeCfg({ col }) {
  if (!col) {
    return "Please select a column to winsorize!";
  }
  return null;
}

function buildCode({ col, group, limits, inclusive }) {
  if (!col) {
    return null;
  }
  let winsorizeParams = [`limits=[${_.join(limits, ", ")}]`];
  if (_.some(inclusive)) {
    winsorizeParams.push(`inclusive=[${_.join(inclusive, ", ")}]`);
  }
  winsorizeParams = `, ${_.join(winsorizeParams, ", ")}`;
  const code = ["from scipy.stats import mstats\n"];
  if (_.size(group)) {
    code.push("def winsorize_series(group):");
    code.push(`\treturn mstats.winsorize(group${winsorizeParams})\n`);
    code.push(`df.groupby(['${_.join(group, "', '")}'])['${col}'].transform(winsorize_series)\n`);
  } else {
    code.push(`mstats.winsorize(df['${col}']${winsorizeParams})`);
  }
  return code;
}

class CreateWinsorize extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      group: null,
      col: null,
      limits: [10, 90],
      includeLower: true,
      includeUpper: true,
    };
    this.updateState = this.updateState.bind(this);
    this.renderSelect = this.renderSelect.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = {
      col: _.get(currState, "col.value") || null,
      group: _.map(currState.group, "value") || null,
      limits: [_.round(currState.limits[0] / 100.0, 2), _.round(1.0 - currState.limits[1] / 100.0, 2)],
      inclusive: [currState.includeLower, currState.includeUpper],
    };
    const code = buildCode(cfg);
    this.setState(currState, () => this.props.updateState({ cfg, code }));
  }

  renderSelect(label, prop, otherProps, isMulti = false) {
    const { columns } = this.props;
    let finalOptions = _.map(columns, "name");
    const otherValues = _(this.state).pick(otherProps).values().concat().map("value").compact().value();
    finalOptions = _.reject(finalOptions, otherValues);
    return (
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{label}</label>
        <div className="col-md-8">
          <div className="input-group">
            <Select
              isMulti={isMulti}
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={_.map(
                _.sortBy(finalOptions, o => _.toLower(o)),
                o => ({ value: o })
              )}
              getOptionLabel={_.property("value")}
              getOptionValue={_.property("value")}
              value={this.state[prop]}
              onChange={selected => this.updateState({ [prop]: selected })}
              isClearable
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <React.Fragment>
        {this.renderSelect("Col", "col", "group")}
        {this.renderSelect("Group By", "group", "col", true)}
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Limits</label>
          <div className="col-md-8">
            <div className="input-group">
              <input
                type="text"
                className="form-control mr-3 slider-input"
                value={this.state.limits[0]}
                onChange={e => this.updateState({ limits: [parseInt(e.target.value), this.state.limits[1]] })}
              />
              <StyledSlider
                defaultValue={this.state.limits}
                renderTrack={Track}
                renderThumb={Thumb}
                value={this.state.limits}
                onAfterChange={limits => this.updateState({ limits })}
              />
              <input
                type="text"
                className="form-control ml-3 slider-input"
                value={this.state.limits[1]}
                onChange={e => this.updateState({ limits: [this.state.limits[0], parseInt(e.target.value)] })}
              />
            </div>
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Include Limits</label>
          <div className="col-md-8 mt-auto mb-auto">
            <span>Lower:</span>
            <i
              className={`ico-check-box${this.state.includeLower ? "" : "-outline-blank"} pointer pl-3 pr-5`}
              onClick={() => this.updateState({ includeLower: !this.state.includeLower })}
            />
            <span>Upper:</span>
            <i
              className={`ico-check-box${this.state.includeUpper ? "" : "-outline-blank"} pointer pl-3`}
              onClick={() => this.updateState({ includeUpper: !this.state.includeUpper })}
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
CreateWinsorize.displayName = "CreateWinsorize";
CreateWinsorize.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
};

export { CreateWinsorize, validateWinsorizeCfg, buildCode };
