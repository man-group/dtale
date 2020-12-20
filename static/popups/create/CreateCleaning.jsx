import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import ColumnSelect from "./ColumnSelect";
import Descriptions from "./cleaning-descriptions.json";
import { buildCleaningCode as buildCode } from "./codeSnippets";
import Languages from "./nltk-languages.json";

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

const CLEANERS = [
  { value: "drop_multispace", label: "Replace Multi-Space w/ Single-Space" },
  { value: "drop_punctuation", label: "Remove Punctuation", word_count: true },
  { value: "stopwords", label: "Drop Stop Words" },
  { value: "nltk_stopwords", label: "Drop NLTK Stop Words" },
  { value: "drop_numbers", label: "Remove Numbers", word_count: true },
  { value: "keep_alpha", label: "Keep Only Alpha", word_count: true },
  {
    value: "normalize_accents",
    label: "Normalize Accent Characters",
    word_count: true,
  },
  { value: "drop_all_space", label: "Remove Spaces", word_count: true },
  {
    value: "drop_repeated_words",
    label: "Drop Repeated Words",
    word_count: true,
  },
  {
    value: "add_word_number_space",
    label: "Add Space Between Word and Numbers",
    word_count: true,
  },
  {
    value: "drop_repeated_chars",
    label: "Remove Repeated Chars",
    word_count: true,
  },
  { value: "update_case", label: "Update Word Case" },
  {
    value: "space_vals_to_empty",
    label: "Update Space Values to Empty String",
    word_count: true,
  },
  {
    value: "hidden_chars",
    label: "Remove Hidden Characters",
    word_count: true,
  },
  {
    value: "replace_hyphen_w_space",
    label: "Replace Hyphens w/ Space",
    word_count: true,
  },
];

class CreateCleaning extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      col: null,
      cleaners: ["hidden_chars"],
      language: { value: "english" },
      description: null,
    };
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
    if (_.includes(currState.cleaners, "nltk_stopwords")) {
      updatedState.cfg.language = _.get(currState, "language.value");
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
                  onClick: () => this.updateCleaners(cleaner.value),
                  onMouseEnter: () =>
                    this.setState({
                      description: _.get(Descriptions, cleaner.value),
                    }),
                  onMouseLeave: () => this.setState({ description: null }),
                };
                if (_.includes(this.state.cleaners, cleaner.value)) {
                  buttonProps.className += " btn-primary active";
                } else {
                  buttonProps.className += " btn-light inactive pointer";
                  buttonProps.style.border = "solid 1px #a7b3b7";
                }
                return (
                  <div key={i} className="col-md-3 p-1">
                    <button {...buttonProps}>{cleaner.label}</button>
                  </div>
                );
              })}
            </div>
            <label className="col-auto col-form-label pl-3 pr-3 row" style={{ fontSize: "85%" }}>
              {this.state.description}
            </label>
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
        {_.includes(this.state.cleaners, "nltk_stopwords") && (
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">NLTK Language</label>
            <div className="col-md-8">
              <Select
                className="Select is-clearable is-searchable Select--single"
                classNamePrefix="Select"
                options={_.map(Languages, l => ({ value: l }))}
                getOptionLabel={_.property("value")}
                getOptionValue={_.property("value")}
                value={this.state.language}
                onChange={selected => this.updateState({ language: selected })}
                noOptionsText={() => "No columns found"}
                filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
              />
            </div>
          </div>
        )}
        {_.includes(this.state.cleaners, "update_case") && (
          <div className="form-group row">
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

export { CreateCleaning, validateCleaningCfg, buildCode, CLEANERS };
