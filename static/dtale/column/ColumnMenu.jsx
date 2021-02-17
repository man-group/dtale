import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { openChart } from "../../actions/charts";
import actions from "../../actions/dtale";
import { buildURLString } from "../../actions/url-utils";
import ColumnFilter from "../../filters/ColumnFilter";
import { exports as gu } from "../gridUtils";
import menuFuncs from "../menu/dataViewerMenuUtils";
import serverState from "../serverStateManagement";
import ColumnMenuHeader from "./ColumnMenuHeader";
import ColumnMenuOption from "./ColumnMenuOption";
import HeatMapOption from "./HeatMapOption";

const { ROW_HEIGHT, SORT_PROPS } = gu;
const MOVE_COLS = [
  ["step-backward", serverState.moveToFront, "Move Column To Front", {}],
  ["caret-left", serverState.moveLeft, "Move Column Left", { fontSize: "1.2em", padding: 0, width: "1.3em" }],
  ["caret-right", serverState.moveRight, "Move Column Right", { fontSize: "1.2em", padding: 0, width: "1.3em" }],
  ["step-forward", serverState.moveToBack, "Move Column To Back", {}],
];

function buildCaretClass(caretPct = 90) {
  const lastCaretStyle = _.get($("head").find("style:last-child"), "0.innerHTML");
  if (_.endsWith(lastCaretStyle || "", ".column-toggle__dropdown::after {right: " + caretPct + "%}")) {
    return; // don't continually add styling if its already set
  }
  const finalCaretPct = _.isUndefined(caretPct) ? 90 : caretPct;
  let caretStyle = "<style>";
  caretStyle += ".column-toggle__dropdown::before {right: " + finalCaretPct + "%}";
  caretStyle += ".column-toggle__dropdown::after {right: " + finalCaretPct + "%}";
  caretStyle += "</style>";
  $("head").append(caretStyle);
}

function positionMenu(selectedToggle, menuDiv, isPreview) {
  const currLeft = _.get(selectedToggle.offset(), "left", 0);
  const currTop = isPreview ? 0 : _.get(selectedToggle.offset(), "top", 0);
  const divWidth = menuDiv.width();
  const css = {};
  if (currLeft + divWidth > window.innerWidth) {
    const finalLeft = currLeft - (currLeft + divWidth + 20 - window.innerWidth);
    css.left = finalLeft;
    const overlapPct = (currLeft - (finalLeft - 20)) / divWidth;
    const caretPct = Math.floor(100 - overlapPct * 100);
    buildCaretClass(caretPct);
  } else {
    css.left = currLeft;
    buildCaretClass();
  }
  css.top = currTop + ROW_HEIGHT - 6;
  if (isPreview) {
    css.left -= 40;
  }
  menuDiv.css(css);
}

function ignoreMenuClicks(e) {
  const colFilter = $("div.column-filter");
  if (colFilter && (colFilter.is(e.target) || colFilter.has(e.target).length > 0)) {
    return true; // ignore filter clicks
  }
  if (colFilter && $(e.target).hasClass("Select__option")) {
    return true; // ignore option selection
  }
  if ($(e.target).hasClass("ico-info")) {
    return true; // ignore option selection
  }
  if (colFilter && e.target.nodeName === "svg") {
    return true; // ignore option selection
  }
  return false;
}

class ReactColumnMenu extends React.Component {
  constructor(props) {
    super(props);
    this.updatePosition = this.updatePosition.bind(this);
  }

  updatePosition() {
    if (!_.isNull(this.props.selectedCol)) {
      positionMenu($(`div.${this.props.selectedToggle}`), $(this._div), this.props.isPreview);
    }
  }

  componentDidUpdate() {
    this.updatePosition();
  }

  render() {
    const { columnMenuOpen, dataId, selectedCol, openChart, t } = this.props;
    if (!selectedCol) {
      return null;
    }
    const colCfg = _.find(this.props.columns, { name: selectedCol }) || {};
    const unlocked = _.get(colCfg, "locked", false) === false;
    let currDir = _.find(this.props.sortInfo, ([col, _dir]) => selectedCol === col);
    currDir = _.isUndefined(currDir) ? SORT_PROPS[2].dir : currDir[1];
    const openPopup = (type, height = 450, width = 500) => () => {
      if (menuFuncs.shouldOpenPopup(height, width)) {
        menuFuncs.open(
          buildURLString(menuFuncs.fullPath(`/dtale/popup/${type}`, dataId), {
            selectedCol,
          }),
          null,
          height,
          width
        );
      } else {
        openChart(
          _.assignIn(
            { type, title: _.capitalize(type) },
            _.pick(this.props, ["selectedCol", "propagateState", "columns"])
          )
        );
      }
    };
    const openDescribe = () =>
      window.open(
        buildURLString(menuFuncs.fullPath("/dtale/popup/describe", dataId), {
          selectedCol,
        }),
        "_blank"
      );
    const openFormatting = () =>
      this.props.propagateState({
        formattingOpen: true,
        selectedCols: [selectedCol],
      });
    const hideCol = () => {
      const hideCallback = () => {
        const updatedColumns = _.map(this.props.columns, c =>
          _.assignIn({}, c, c.name === selectedCol ? { visible: !c.visible } : {})
        );
        this.props.propagateState({ columns: updatedColumns });
      };
      serverState.toggleVisibility(dataId, selectedCol, hideCallback);
    };
    const deleteCol = () => {
      const yesAction = () =>
        this.props.propagateState(
          { columns: _.reject(this.props.columns, { name: selectedCol }) },
          serverState.deleteColumn(dataId, selectedCol)
        );
      const msg = `Are you sure you want to delete the column "${selectedCol}"?`;
      const title = `Delete column - ${selectedCol}`;
      openChart({ type: "confirm", title, msg, yesAction, size: "sm" });
    };
    const renameCol = () =>
      openChart({
        type: "rename",
        selectedCol,
        columns: this.props.columns,
        size: "sm",
      });
    const openAction = action => openPopup(action, 400, 770);
    const closeMenu = () => this.props.hideColumnMenu(selectedCol);
    return (
      <div
        id="column-menu-div"
        className="column-toggle__dropdown"
        hidden={!columnMenuOpen}
        style={{ minWidth: "11em" }}
        ref={cm => (this._div = cm)}>
        {columnMenuOpen && <GlobalHotKeys keyMap={{ CLOSE_MENU: "esc" }} handlers={{ CLOSE_MENU: closeMenu }} />}
        <ColumnMenuHeader col={selectedCol} colCfg={colCfg} />
        <ul>
          <li>
            <span className="toggler-action">
              <i className="fa fa-sort ml-4 mr-4" />
            </span>
            <div className="btn-group compact m-auto font-weight-bold column-sorting">
              {_.map(SORT_PROPS, ({ dir, col }) => {
                const active = dir === currDir;
                return (
                  <button
                    key={dir}
                    style={active ? {} : { color: "#565b68" }}
                    className={`btn btn-primary ${active ? "active" : ""} font-weight-bold`}
                    onClick={active ? _.noop : () => menuFuncs.updateSort([selectedCol], dir, this.props)}
                    disabled={active}>
                    {t(`column_menu:${col.label}`)}
                  </button>
                );
              })}
            </div>
          </li>
          <li>
            <span className="toggler-action">
              <i className="ico-swap-horiz" />
            </span>
            <div className="btn-group compact m-auto font-weight-bold column-sorting">
              {_.map(MOVE_COLS, ([icon, func, hint, icnStyle]) => (
                <button
                  key={icon}
                  style={_.assign({ color: "#565b68", width: "2em" }, icnStyle)}
                  className={`btn btn-primary font-weight-bold`}
                  onClick={func(selectedCol, this.props)}
                  title={t(`column_menu:${hint}`)}>
                  <i className={`fas fa-${icon}`} />
                </button>
              ))}
            </div>
          </li>
          {unlocked && (
            <ColumnMenuOption
              open={serverState.lockCols([selectedCol], this.props)}
              label={t("column_menu:Lock")}
              iconClass="fa fa-lock ml-3 mr-4"
            />
          )}
          {!unlocked && (
            <ColumnMenuOption
              open={serverState.unlockCols([selectedCol], this.props)}
              label={t("column_menu:Unlock")}
              iconClass="fa fa-lock-open ml-2 mr-4"
            />
          )}
          <ColumnMenuOption open={hideCol} label={t("column_menu:Hide")} iconClass="ico-visibility-off" />
          <ColumnMenuOption open={deleteCol} label={t("column_menu:Delete")} iconClass="ico-delete" />
          <ColumnMenuOption open={renameCol} label={t("column_menu:Rename")} iconClass="ico-edit" />
          <ColumnMenuOption
            open={openAction("replacement")}
            label={t("column_menu:Replacements")}
            iconClass="fas fa-backspace mr-3"
          />
          <ColumnMenuOption
            open={openAction("type-conversion")}
            label={t("builders:Type Conversion")}
            iconClass="ico-swap-horiz"
          />
          {gu.findColType(colCfg.dtype) === "string" && (
            <ColumnMenuOption
              open={openAction("cleaners")}
              label={t("column_menu:Clean Column")}
              iconClass="fas fa-pump-soap ml-3 mr-4"
            />
          )}
          <ColumnMenuOption
            open={openAction("duplicates")}
            label={t("menu:Duplicates")}
            iconClass="fas fa-clone ml-2 mr-4"
          />
          <ColumnMenuOption open={openDescribe} label={t("menu:Describe")} iconClass="ico-view-column" />
          <ColumnMenuOption
            open={openPopup("column-analysis", 425, 810)}
            label={t("column_menu:Column Analysis")}
            iconClass="ico-equalizer"
          />
          {_.has(colCfg, "lowVariance") && (
            <ColumnMenuOption
              open={openPopup("variance", 400, 770)}
              label={t("column_menu:Variance Report")}
              iconClass="fas fa-chart-bar ml-2 mr-4"
            />
          )}
          <ColumnMenuOption open={openFormatting} label={t("column_menu:Formats")} iconClass="ico-palette" />
          <HeatMapOption {..._.pick(this.props, ["propagateState", "backgroundMode", "selectedCol"])} colCfg={colCfg} />
          <ColumnFilter {...this.props} />
        </ul>
      </div>
    );
  }
}
ReactColumnMenu.displayName = "ReactColumnMenu";
ReactColumnMenu.propTypes = {
  selectedCol: PropTypes.string,
  selectedToggle: PropTypes.string,
  columns: PropTypes.array,
  columnMenuOpen: PropTypes.bool,
  sortInfo: PropTypes.array,
  propagateState: PropTypes.func,
  dataId: PropTypes.string.isRequired,
  noInfo: PropTypes.bool,
  openChart: PropTypes.func,
  hideColumnMenu: PropTypes.func,
  outlierFilters: PropTypes.object,
  backgroundMode: PropTypes.string,
  isPreview: PropTypes.bool,
  t: PropTypes.func,
};
const TranslatedReactColumnMenu = withTranslation(["menu", "column_menu", "builders"])(ReactColumnMenu);
const ReduxColumnMenu = connect(
  state => _.pick(state, ["dataId", "columnMenuOpen", "selectedCol", "selectedToggle", "isPreview"]),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    hideColumnMenu: colName => dispatch(actions.hideColumnMenu(colName)),
  })
)(TranslatedReactColumnMenu);

export { ReduxColumnMenu as ColumnMenu, TranslatedReactColumnMenu as ReactColumnMenu, positionMenu, ignoreMenuClicks };
