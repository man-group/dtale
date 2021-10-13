import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import * as actions from "../../actions/dtale";
import { SingleTrack, StyledSlider, Thumb } from "../../sliderUtils";
import serverStateManagement from "../serverStateManagement";
import { MenuItem } from "./MenuItem";

class ReactMaxDimensionOption extends React.Component {
  constructor(props) {
    super(props);
    this.state = { currMaxDimension: props.maxDimension ?? 100 };
    this.updateMax = this.updateMax.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.maxDimension !== prevProps.maxDimension) {
      this.setState({ currMaxDimension: this.props.maxDimension ?? 100 });
    }
  }

  updateMax(value) {
    const callback = () => this.props.updateMaxDimension(value);
    this.setState({ currMaxDimension: value }, () => serverStateManagement.updateMaxColumnWidth(value, callback));
  }

  render() {
    const { icon, label, description, maxDimension, t } = this.props;
    const checkBoxClass = `ico-check-box${maxDimension === null ? "-outline-blank" : ""}`;
    const checkBoxClick = () => {
      if (this.props.maxDimension === null) {
        this.updateMax(this.state.currMaxDimension);
      } else {
        serverStateManagement.updateMaxColumnWidth("", this.props.clearMaxDimension);
      }
    };
    return (
      <MenuItem style={{ color: "#565b68" }} description={t(`menu_description:max_${description}`)}>
        <span className="toggler-action">
          <i className={`fas fa-arrows-alt-${icon}`} />
        </span>
        <div className="w-100">
          <div className="row m-0">
            <span className="font-weight-bold col">
              {t(`Max ${label}`, { ns: "menu" })}
              <small className="pl-2">(px)</small>
            </span>
            <i className={`${checkBoxClass} col-auto pointer mb-auto mt-auto`} onClick={checkBoxClick} />
          </div>
          <div className="row m-0 mb-3" data-tip={t("Press ENTER to submit", { ns: "text_enter" })}>
            <input
              type="text"
              className="form-control ml-3 slider-input col-auto pt-0 pb-0 pl-3 pr-3 align-center"
              style={{ width: "3em" }}
              value={`${this.state.currMaxDimension}`}
              onChange={e => {
                const parsedInt = parseInt(e.target.value);
                if (!_.isNaN(parsedInt)) {
                  this.setState({ currMaxDimension: parsedInt });
                }
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && this.state.currMaxDimension) {
                  this.updateMax(this.state.currMaxDimension);
                }
              }}
            />
            <div className="col pl-3 pr-2">
              <StyledSlider
                defaultValue={this.state.currMaxDimension}
                renderTrack={SingleTrack}
                renderThumb={Thumb}
                max={1000}
                value={this.state.currMaxDimension}
                onAfterChange={currMaxDimension => this.updateMax(currMaxDimension)}
              />
            </div>
          </div>
        </div>
      </MenuItem>
    );
  }
}
ReactMaxDimensionOption.displayName = "ReactMaxDimensionOption";
ReactMaxDimensionOption.propTypes = {
  label: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.string,
  maxDimension: PropTypes.number,
  updateMaxDimension: PropTypes.func,
  clearMaxDimension: PropTypes.func,
  t: PropTypes.func,
};
const TranslatedMaxDimensionOption = withTranslation(["menu", "menu_description", "text_enter"])(
  ReactMaxDimensionOption
);

const ReduxMaxWidthOption = connect(
  ({ maxColumnWidth }) => ({
    label: "Width",
    description: "width",
    icon: "h mr-4 ml-1",
    maxDimension: maxColumnWidth,
  }),
  dispatch => ({
    updateMaxDimension: width => dispatch(actions.updateMaxWidth(width)),
    clearMaxDimension: () => dispatch(actions.clearMaxWidth()),
  })
)(TranslatedMaxDimensionOption);

const ReduxMaxHeightOption = connect(
  ({ maxRowHeight }) => ({
    label: "Height",
    description: "height",
    icon: "v mr-5 ml-3",
    maxDimension: maxRowHeight,
  }),
  dispatch => ({
    updateMaxDimension: height => dispatch(actions.updateMaxHeight(height)),
    clearMaxDimension: () => dispatch(actions.clearMaxHeight()),
  })
)(TranslatedMaxDimensionOption);

export {
  ReduxMaxWidthOption as MaxWidthOption,
  ReduxMaxHeightOption as MaxHeightOption,
  TranslatedMaxDimensionOption as ReactMaxDimensionOption,
};
