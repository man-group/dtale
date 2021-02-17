import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import menuUtils from "../../menuUtils";

function buildState({ y, data }) {
  const state = {};
  _.forEach(y, ({ value }) => {
    state[`${value}-min`] = _.get(data, ["min", value], "");
    state[`${value}-max`] = _.get(data, ["max", value], "");
  });
  return state;
}

require("./AxisEditor.css");

class AxisEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.assignIn({ open: false }, buildState(props));
    this.closeMenu = this.closeMenu.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    return !_.isEqual(this.props.data, newProps.data) || !_.isEqual(this.state, newState);
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props.data, prevProps.data)) {
      this.setState(buildState(this.props));
    }
  }

  closeMenu() {
    const { t } = this.props;
    const settings = {
      min: _.assign({}, this.props.data.min),
      max: _.assign({}, this.props.data.max),
    };
    const errors = [];
    _.forEach(this.props.y, ({ value }) => {
      _.forEach(["min", "max"], prop => {
        const curr = this.state[`${value}-${prop}`];
        if (curr !== "" && !_.isNaN(parseFloat(curr))) {
          settings[prop][value] = parseFloat(curr);
        } else {
          errors.push(`${value} ${t("has invalid")} ${prop}!`);
        }
      });
    });
    _.forEach(this.props.y, ({ value }) => {
      if (settings.min[value] > settings.max[value]) {
        errors.push(`${value} ${t("must have a min < max!")}`);
      }
    });
    if (_.size(errors)) {
      this.setState({ errors });
    } else {
      this.setState({ open: false }, () => this.props.updateAxis(settings));
    }
  }

  render() {
    if (_.isEmpty(this.props.data)) {
      return null;
    }
    const { min, max } = this.props.data;
    const { t, y } = this.props;
    const axisMarkup = _.map(y, ({ value }, idx) => {
      const minProp = `${value}-min`;
      const maxProp = `${value}-max`;
      return (
        <li key={idx}>
          <span className="mb-auto mt-auto font-weight-bold">{value}</span>
          <span className="mb-auto mt-auto">{t("Min")}:</span>
          <span>
            <input
              className="axis-input form-control input-sm"
              type="text"
              value={_.get(this.state, minProp, "")}
              onChange={e => this.setState({ [minProp]: e.target.value })}
            />
          </span>
          <span className="mb-auto mt-auto">{t("Max")}:</span>
          <span>
            <input
              className="axis-input form-control input-sm"
              type="text"
              value={_.get(this.state, maxProp, "")}
              onChange={e => this.setState({ [maxProp]: e.target.value })}
            />
          </span>
        </li>
      );
    });
    const menuHandler = menuUtils.openMenu("axisEditor", () => this.setState({ open: true }), this.closeMenu);
    return (
      <div className="toolbar__axis">
        <div className="input-group">
          <span className="input-group-addon">{t("Axis Ranges")}</span>
          <div className="input-group column-toggle">
            <span className="form-control custom-select axis-select" onClick={menuHandler}>
              {_.truncate(
                _.join(
                  _.map(y, ({ value }) => `${value} (${min[value]},${max[value]})`),
                  ", "
                )
              )}
            </span>
            <div className="axis-toggle__dropdown" hidden={!this.state.open}>
              <ul>{axisMarkup}</ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
AxisEditor.displayName = "AxisEditor";
AxisEditor.propTypes = {
  data: PropTypes.object,
  y: PropTypes.arrayOf(PropTypes.object),
  updateAxis: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation("charts")(AxisEditor);
