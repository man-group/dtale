import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import ColumnSelect from "./ColumnSelect";
import { buildCleaningCode as buildCode } from "./codeSnippets";

function validateCleaningCfg({ col, cleaners, stopwords, caseType }) {
  if (!col) {
    return "Please select a column to clean!";
  }
  if (!cleaners) {
    return "Please apply function(s)!";
  }
  if (_.includes(cleaners, "update_case") && !caseType) {
    return "Please select a case to apply!";
  }
  if (_.includes(cleaners, "stopwords") && !stopwords) {
    return "Please enter a comma-separated string of stop words!";
  }
  return null;
}

const CLEANERS = _.concat(
  ["drop_multispace", "drop_punctuation", "stopwords", "nltk_stopwords", "drop_numbers", "keep_alpha"],
  ["normalize_accents", "drop_all_space", "drop_repeated_words", "add_word_number_space", "drop_repeated_chars"],
  ["update_case", "space_vals_to_empty"]
);
const NAMES = {
  drop_multispace: "Replace Multi-Space w/ Single-Space",
  drop_punctuation: "Remove Punctuation",
  stopwords: "Drop Stop Words",
  nltk_stopwords: "Drop NLTK Stop Words",
  drop_numbers: "Remove Numbers",
  keep_alpha: "Keep Only Alpha",
  normalize_accents: "Drop Accent Characters",
  drop_all_space: "Remove Spaces",
  drop_repeated_words: "Drop Repeated Words",
  add_word_number_space: "Add Space Between Word and Numbers",
  drop_repeated_chars: "Remove Repeated Chars",
  update_case: "Update Word Case",
  space_vals_to_empty: "Update Space Values to Empty String",
};

class CreateCleaning extends React.Component {
  constructor(props) {
    super(props);
    this.state = { col: null, cleaners: [] };
    this.updateState = this.updateState.bind(this);
    this.updateCleaners = this.updateCleaners.bind(this);
  }

  componentDidMount() {
    const prePopulatedCol = _.get(this.props, "prePopulated.col");
    if (prePopulatedCol) {
      this.updateState({ col: { value: prePopulatedCol } });
    }
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        col: _.get(currState, "col.value") || null,
        cleaners: currState.cleaners,
      },
    };
    if (_.includes(currState.cleaners, "update_case")) {
      updatedState.cfg.caseType = currState.caseType;
    }
    if (_.includes(currState.cleaners, "stopwords")) {
      updatedState.cfg.stopwords = _.split(currState.stopwords, ",");
    }
    updatedState.code = buildCode(updatedState.cfg);
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_cleaned`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  updateCleaners(cleaner) {
    if (_.includes(this.state.cleaners, cleaner)) {
      this.updateState({ cleaners: _.without(this.state.cleaners, cleaner) });
    } else {
      this.updateState({ cleaners: [...this.state.cleaners, cleaner] });
    }
  }

  render() {
    const prePopulatedCol = _.get(this.props, "prePopulated.col");
    return (
      <React.Fragment>
        {!prePopulatedCol && (
          <ColumnSelect
            label="Col"
            prop="col"
            parent={this.state}
            updateState={this.updateState}
            columns={this.props.columns}
            dtypes={["string"]}
          />
        )}
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Function(s)</label>
          <div className="col-md-8 builders">
            <div className="row">
              {_.map(CLEANERS, (cleaner, i) => {
                const buttonProps = {
                  className: "btn w-100",
                  style: {
                    padding: "0.45rem 0.3rem",
                    fontSize: "85%",
                    whiteSpace: "pre-wrap",
                    height: "42px",
                  },
                };
                if (_.includes(this.state.cleaners, cleaner)) {
                  buttonProps.className += " btn-primary active";
                } else {
                  buttonProps.className += " btn-light inactive pointer";
                  buttonProps.style.border = "solid 1px #a7b3b7";
                  buttonProps.onClick = () => this.updateCleaners(cleaner);
                }
                return (
                  <div key={i} className="col-md-3 p-1">
                    <button {...buttonProps}>{NAMES[cleaner] ?? cleaner}</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {_.includes(this.state.cleaners, "stopwords") && (
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">Stop Words</label>
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                value={this.state.stopwords || ""}
                onChange={e => this.updateState({ stopwords: e.target.value })}
              />
            </div>
          </div>
        )}
        {_.includes(this.state.cleaners, "update_case") && (
          <div key={1} className="form-group row">
            <label className="col-md-3 col-form-label text-right">Case</label>
            <div className="col-md-8">
              <div className="btn-group">
                {_.map(
                  [
                    ["upper", "Upper"],
                    ["lower", "Lower"],
                    ["title", "Title"],
                  ],
                  ([caseType, label]) => {
                    const buttonProps = { className: "btn btn-primary" };
                    if (caseType === this.state.caseType) {
                      buttonProps.className += " active";
                    } else {
                      buttonProps.className += " inactive";
                      buttonProps.onClick = () => this.updateState({ caseType });
                    }
                    return (
                      <button key={caseType} {...buttonProps}>
                        {label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}
      </React.Fragment>
    );
  }
}
CreateCleaning.displayName = "CreateCleaning";
CreateCleaning.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  prePopulated: PropTypes.object,
};

export { CreateCleaning, validateCleaningCfg, buildCode };
