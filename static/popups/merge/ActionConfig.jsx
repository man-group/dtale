import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

import ButtonToggle from "../../ButtonToggle";
import actions from "../../actions/merge";
import ExampleCode from "./code.json";

const actionOpts = t => [
  { label: t("Merge"), value: "merge" },
  { label: t("Stack"), value: "stack" },
];

const howOpts = t =>
  _.map(["left", "right", "inner", "outer"], h => ({
    value: h,
    label: t(_.capitalize(h)),
  }));

const exampleImage = name => `https://raw.githubusercontent.com/aschonfeld/dtale-media/master/merge_images/${name}.png`;

// Look to add images from pandas documentation: https://pandas.pydata.org/pandas-docs/stable/user_guide/merging.html
// Example image URL: https://pandas.pydata.org/pandas-docs/stable/_images/merging_join_multi_df.png

class ReactActionConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = { description: false };
    this.renderMerge = this.renderMerge.bind(this);
    this.renderStack = this.renderStack.bind(this);
  }

  renderMerge() {
    const { action, mergeConfig, updateActionConfig, t } = this.props;
    const { how, sort, indicator } = mergeConfig;
    return (
      <React.Fragment>
        <div className="row ml-0 mr-0">
          <div className="col-md-4">
            <div className="form-group row">
              <label className="col-auto col-form-label text-right pr-0">{t("How")}:</label>
              <ButtonToggle
                options={howOpts(t)}
                update={value => updateActionConfig({ action, prop: "how", value })}
                defaultValue={how}
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="form-group row">
              <label className="col-auto col-form-label text-right pr-5">{t("Sort")}:</label>
              <i
                className={`ico-check-box${sort ? "" : "-outline-blank"} pointer mb-auto mt-auto`}
                onClick={() => updateActionConfig({ action, prop: "sort", value: !sort })}
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="form-group row">
              <label className="col-md-3 col-form-label text-right pr-5">{t("Indicator")}:</label>
              <i
                className={`ico-check-box${indicator ? "" : "-outline-blank"} pointer mb-auto mt-auto`}
                onClick={() =>
                  updateActionConfig({
                    action,
                    prop: "indicator",
                    value: !indicator,
                  })
                }
              />
            </div>
          </div>
        </div>
        <dl className="dataset accordion pt-3">
          <dt
            className={`dataset accordion-title${this.state.example ? " is-expanded" : ""} pointer pl-3`}
            onClick={() => this.setState({ example: !this.state.example })}>
            {t("Example")}
          </dt>
          <dd className={`p-0 dataset accordion-content${this.state.example ? " is-expanded" : ""} example`}>
            <div className="row pt-4 ml-0 mr-0">
              <div className="col-auto">
                {how === "inner" && <img src={exampleImage("merging_merge_on_key_multiple")} />}
                {how === "left" && <img src={exampleImage("merging_merge_on_key_left")} />}
                {how === "right" && <img src={exampleImage("merging_merge_on_key_right")} />}
                {how === "outer" && <img src={exampleImage("merging_merge_on_key_outer")} />}
              </div>
              <div className="col-auto">
                <SyntaxHighlighter language="python" style={docco}>
                  {_.join(ExampleCode[how], "\n")}
                </SyntaxHighlighter>
              </div>
            </div>
          </dd>
        </dl>
      </React.Fragment>
    );
  }

  renderStack() {
    const { action, stackConfig, updateActionConfig, t } = this.props;
    const { ignoreIndex } = stackConfig;
    return (
      <React.Fragment>
        <div className="row ml-0 mr-0">
          <div className="col-md-6">
            <div className="form-group row">
              <label className="col-auto col-form-label text-right pr-3">{t("Ignore Index")}:</label>
              <i
                className={`ico-check-box${ignoreIndex ? "" : "-outline-blank"} pointer mb-auto mt-auto`}
                onClick={() =>
                  updateActionConfig({
                    action,
                    prop: "ignoreIndex",
                    value: !ignoreIndex,
                  })
                }
              />
            </div>
          </div>
        </div>
        <dl className="dataset accordion pt-3">
          <dt
            className={`dataset accordion-title${this.state.example ? " is-expanded" : ""} pointer pl-3`}
            onClick={() => this.setState({ example: !this.state.example })}>
            {t("Example")}
          </dt>
          <dd className={`p-0 dataset accordion-content${this.state.example ? " is-expanded" : ""} example`}>
            <div className="row pt-4 ml-0 mr-0">
              <div className="col-auto">
                <img src={exampleImage("merging_concat_basic")} />
              </div>
              <div className="col-auto">
                <SyntaxHighlighter language="python" style={docco}>
                  {_.join(ExampleCode.stack, "\n")}
                </SyntaxHighlighter>
              </div>
            </div>
          </dd>
        </dl>
      </React.Fragment>
    );
  }

  render() {
    const { action, t } = this.props;
    return (
      <ul className="list-group ml-3 mr-3 pt-3">
        <li className="list-group-item p-3 section">
          <div className="row ml-0 mr-0">
            <div className="col-auto pl-4 pr-0">
              <h3 className="m-auto">{t("Action")}</h3>
            </div>
            <ButtonToggle
              options={actionOpts(t)}
              update={action => this.props.updateActionType(action)}
              defaultValue={action}
            />
            <div className="col" />
          </div>
          <ul className="list-group p-4">
            <li className="list-group-item">
              {action === "merge" && this.renderMerge()}
              {action === "stack" && this.renderStack()}
            </li>
          </ul>
        </li>
      </ul>
    );
  }
}
ReactActionConfig.displayName = "ReactActionConfig";
ReactActionConfig.propTypes = {
  action: PropTypes.string,
  mergeConfig: PropTypes.object,
  stackConfig: PropTypes.object,
  updateActionType: PropTypes.func,
  updateActionConfig: PropTypes.func,
  t: PropTypes.func,
};

const TranslateReactActionConfig = withTranslation("merge")(ReactActionConfig);
const ReduxActionConfig = connect(
  ({ action, mergeConfig, stackConfig }) => ({
    action,
    mergeConfig,
    stackConfig,
  }),
  dispatch => ({
    updateActionType: action => dispatch(actions.updateActionType(action)),
    updateActionConfig: actionUpdate => dispatch(actions.updateActionConfig(actionUpdate)),
  })
)(TranslateReactActionConfig);
export { ReduxActionConfig as default, TranslateReactActionConfig as ReactActionConfig };
