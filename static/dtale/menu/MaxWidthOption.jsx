import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import actions from "../../actions/dtale";
import { SingleTrack, StyledSlider, Thumb } from "../../sliderUtils";
import serverStateManagement from "../serverStateManagement";
import { MenuItem } from "./MenuItem";

class ReactMaxWidthOption extends React.Component {
  constructor(props) {
    super(props);
    this.state = { currMaxWidth: props.maxColumnWidth ?? 100 };
    this.updateMax = this.updateMax.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.maxColumnWidth !== prevProps.maxColumnWidth) {
      this.setState({ currMaxWidth: this.props.maxColumnWidth ?? 100 });
    }
  }

  updateMax(value) {
    const callback = () => this.props.updateMaxWidth(value);
    this.setState({ currMaxWidth: value }, () => serverStateManagement.updateMaxColumnWidth(value, callback));
  }

  render() {
    const { maxColumnWidth, t } = this.props;
    const checkBoxClass = `ico-check-box${maxColumnWidth === null ? "-outline-blank" : ""}`;
    const checkBoxClick = () => {
      if (this.props.maxColumnWidth === null) {
        this.updateMax(this.state.currMaxWidth);
      } else {
        serverStateManagement.updateMaxColumnWidth("", this.props.clearMaxWidth);
      }
    };
    return (
      <MenuItem style={{ color: "#565b68" }} description={t("menu_description:max_width")}>
        <span className="toggler-action">
          <i className="fas fa-arrows-alt-h mr-4 ml-1" />
        </span>
        <div className="w-100">
          <div className="row m-0">
            <span className="font-weight-bold col">
              {t("menu:Max Width")}
              <small className="pl-2">(px)</small>
            </span>
            <i className={`${checkBoxClass} col-auto pointer mb-auto mt-auto`} onClick={checkBoxClick} />
          </div>
          <div className="row m-0 mb-3" data-tip={t("text_enter:Press ENTER to submit")}>
            <input
              type="text"
              className="form-control ml-3 slider-input col-auto pt-0 pb-0 pl-3 pr-3 align-center"
              style={{ width: "3em" }}
              value={`${this.state.currMaxWidth}`}
              onChange={e => {
                const parsedInt = parseInt(e.target.value);
                if (!_.isNaN(parsedInt)) {
                  this.setState({ currMaxWidth: parsedInt });
                }
              }}
              onKeyPress={e => {
                if (e.key === "Enter" && this.state.currMaxWidth) {
                  this.updateMax(this.state.currMaxWidth);
                }
              }}
            />
            <div className="col pl-3 pr-2">
              <StyledSlider
                defaultValue={this.state.currMaxWidth}
                renderTrack={SingleTrack}
                renderThumb={Thumb}
                max={1000}
                value={this.state.currMaxWidth}
                onAfterChange={currMaxWidth => this.updateMax(currMaxWidth)}
              />
            </div>
          </div>
        </div>
      </MenuItem>
    );
  }
}
ReactMaxWidthOption.displayName = "ReactMaxWidthOption";
ReactMaxWidthOption.propTypes = {
  maxColumnWidth: PropTypes.number,
  updateMaxWidth: PropTypes.func,
  clearMaxWidth: PropTypes.func,
  t: PropTypes.func,
};
const TranslatedMaxWidthOption = withTranslation(["menu", "menu_description", "text_enter"])(ReactMaxWidthOption);
const ReduxMaxWidthOption = connect(
  ({ maxColumnWidth }) => ({ maxColumnWidth }),
  dispatch => ({
    updateMaxWidth: width => dispatch(actions.updateMaxWidth(width)),
    clearMaxWidth: () => dispatch(actions.clearMaxWidth()),
  })
)(TranslatedMaxWidthOption);
export { ReduxMaxWidthOption as MaxWidthOption, TranslatedMaxWidthOption as ReactMaxWidthOption };
