import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { BouncerWrapper } from "../../BouncerWrapper";
import actions from "../../actions/merge";
import { jumpToDataset } from "../upload/uploadUtils";
import DataPreview from "./DataPreview";

function buildCode({ action, datasets, mergeConfig, stackConfig }, name) {
  let code = ["import dtale", "from dtale.views import startup\n"];
  const buildIdx = (action, index) =>
    action === "merge" && index ? `.setIndex(['${_.join(_.map(index, "name"), "','")}'])` : "";

  _.forEach(datasets, ({ dataId, columns, index }, i) => {
    let cols = [];
    if (action === "merge" && columns?.length) {
      cols = _.uniq(_.concat(_.map(columns, "name"), _.map(index, "name")));
    } else if (action === "stack" && columns?.length) {
      cols = _.map(columns, "name");
    }
    const colStr = cols.length ? `[['${_.join(cols, "','")}']]` : "";
    code.push(`df${i + 1} = dtale.get_instance('${dataId}').data${colStr}${buildIdx(action, index)}`);
  });

  if (action === "merge") {
    const { how, sort, indicator } = mergeConfig;
    const buildMerge = (df1, df2, left, right, idx = 1) => {
      let suffixes = "";
      if (left.suffix || right.suffix) {
        const suffixStr = suffix => (suffix ? `'${suffix}'` : "None");
        suffixes = `, suffixes=[${suffixStr(left.suffix)},${suffixStr(right.suffix)}]`;
      }
      let cmd = `final_df = ${df1}.merge(${df2}, how='${how}', left_index=True, right_index=True`;
      const sortParam = sort ? `, sort=True` : "";
      const indicatorParam = indicator ? `, indicator='merge_${idx}'` : "";
      cmd += `${sortParam}${indicatorParam}${suffixes})`;
      return cmd;
    };
    code.push(buildMerge("df1", "df2", datasets[0], datasets[1]));
    if (datasets.length > 2) {
      code = _.concat(
        code,
        _.map(_.slice(datasets, 2), (d, i) => buildMerge("final_df", `df${i + 3}`, {}, d, i + 2))
      );
    }
  } else if (action === "stack") {
    const { ignoreIndex } = stackConfig;
    const ignoreIndexParam = ignoreIndex ? `, ignore_index=True` : "";
    code.push(
      `final_df = pd.concat([${_.join(
        _.map(datasets, (_, i) => `df${i + 1}`),
        ","
      )}]${ignoreIndexParam})`
    );
  }
  code.push(`startup(final_df${name ? `, name='${name}'` : ""})`);
  return code;
}

class ReactMergeOutput extends React.Component {
  constructor(props) {
    super(props);
    this.state = { name: "" };
  }

  render() {
    const { mergeDataId, showCode, t } = this.props;
    return (
      <ul className="list-group ml-3 mr-3 pt-3">
        <li className="list-group-item p-3 section">
          <div className="row ml-0 mr-0">
            <div className="col-auto pl-4 pr-0">
              <h3 className="m-auto">{`${t(_.capitalize(this.props.action))} ${t("Output")}`}</h3>
            </div>
          </div>
          <div className="form-group row p-4 ml-0 mr-0 mb-0">
            <label className="col-form-label text-right">{t("Name")}</label>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                value={this.state.name}
                onChange={e => this.setState({ name: e.target.value })}
              />
            </div>
            <div className="col" />
            {this.props.loadingMerge && (
              <div className="col-auto">
                <BouncerWrapper showBouncer={this.props.loadingMerge} />
              </div>
            )}
            <div className="col-auto">
              <button className="btn-sm btn-primary pointer" onClick={() => this.props.buildMerge(this.state.name)}>
                <i className="ico-remove-circle pr-3" />
                <span>{`${t("Build")} ${t(_.capitalize(this.props.action))}`}</span>
              </button>
            </div>
          </div>
          <div className="row p-4 ml-0 mr-0">
            <div className="col-md-12 p-0">
              <dl className="dataset accordion pt-3">
                <dt
                  className={`dataset accordion-title${showCode ? " is-expanded" : ""} pointer pl-3`}
                  onClick={this.props.toggleShowCode}>
                  {t("Code")}
                </dt>
                <dd className={`p-0 dataset accordion-content${showCode ? " is-expanded" : ""}`}>
                  <div className="row pt-4 ml-0 mr-0">
                    <div className="col-md-12">
                      <SyntaxHighlighter language="python" style={docco}>
                        {_.join(buildCode(this.props, this.state.name), "\n")}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
          {mergeDataId && (
            <React.Fragment>
              <div className="row p-4 ml-0 mr-0">
                <div className="col" />
                <div className="col-auto">
                  <button className="btn btn-primary pointer" onClick={() => jumpToDataset(mergeDataId, _.noop, true)}>
                    <span>{t("Keep Data & Jump To Grid")}</span>
                  </button>
                </div>
                <div className="col-auto">
                  <button className="btn btn-secondary pointer" onClick={this.props.clearMerge}>
                    <span>{t("Clear Data & Keep Editing")}</span>
                  </button>
                </div>
                <div className="col" />
              </div>
              <div className="row p-4 ml-0 mr-0">
                <div className="col-md-12 p-0" style={{ height: 200 }}>
                  <DataPreview dataId={mergeDataId + ""} />
                </div>
              </div>
            </React.Fragment>
          )}
        </li>
      </ul>
    );
  }
}
ReactMergeOutput.displayName = "ReactMergeOutput";
ReactMergeOutput.propTypes = {
  action: PropTypes.string,
  buildMerge: PropTypes.func,
  loadingMerge: PropTypes.bool,
  mergeDataId: PropTypes.string,
  clearMerge: PropTypes.func,
  showCode: PropTypes.bool,
  toggleShowCode: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactMergeOutput = withTranslation("merge")(ReactMergeOutput);
const ReduxMergeOutput = connect(
  ({ instances, action, datasets, loadingMerge, mergeConfig, stackConfig, mergeDataId, showCode }) => ({
    instances,
    action,
    datasets,
    loadingMerge,
    mergeConfig,
    stackConfig,
    mergeDataId,
    showCode,
  }),
  dispatch => ({
    buildMerge: name => dispatch(actions.buildMerge(name)),
    clearMerge: () => dispatch(actions.clearMerge()),
    toggleShowCode: () => dispatch({ type: "toggle-show-code" }),
  })
)(TranslateReactMergeOutput);
export { TranslateReactMergeOutput as ReactMergeOutput, ReduxMergeOutput as default };
