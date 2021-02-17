import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

const SAVE_TYPES = [
  ["inplace", "Inplace"],
  ["new", "New Column"],
];

class ColumnSaveType extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      saveAs: props.saveAs || "inplace",
      name: props.name || null,
    };
    this.updateState = this.updateState.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.name !== prevProps.name) {
      this.setState({ name: this.props.name });
    }
  }

  updateState(state) {
    this.setState(state, () => this.props.propagateState(state));
  }

  render() {
    return (
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{this.props.t("Save As")}</label>
        <div className="col-md-8">
          <div className="row">
            <div className="col-auto btn-group" style={{ height: "fit-content" }}>
              {_.map(SAVE_TYPES, ([saveAs, label], i) => {
                const buttonProps = { className: "btn" };
                if (saveAs === this.state.saveAs) {
                  buttonProps.className += " btn-primary active";
                } else {
                  buttonProps.className += " btn-primary inactive";
                  buttonProps.onClick = () => this.updateState({ saveAs });
                }
                return (
                  <button key={i} {...buttonProps}>
                    {this.props.t(label)}
                  </button>
                );
              })}
            </div>
            <div className="col">
              {this.state.saveAs === "new" && (
                <input
                  type="text"
                  className="form-control"
                  value={this.state.name || ""}
                  onChange={e => this.updateState({ name: e.target.value })}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
ColumnSaveType.displayName = "ColumnSaveType";
ColumnSaveType.propTypes = {
  propagateState: PropTypes.func,
  saveAs: PropTypes.string,
  name: PropTypes.string,
  t: PropTypes.func,
};

export default withTranslation("replacement")(ColumnSaveType);
