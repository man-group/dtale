import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { exports as gu } from "../gridUtils";
import menuFuncs from "../menu/dataViewerMenuUtils";

class SortOptions extends React.Component {
  render() {
    const { sortInfo, selectedCol, t } = this.props;
    let currDir = _.find(sortInfo, ([col, _dir]) => selectedCol === col);
    currDir = _.isUndefined(currDir) ? gu.SORT_PROPS[2].dir : currDir[1];
    return (
      <li>
        <span className="toggler-action">
          <i className="fa fa-sort ml-4 mr-4" />
        </span>
        <div className="btn-group compact m-auto font-weight-bold column-sorting">
          {_.map(gu.SORT_PROPS, ({ dir, col }) => {
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
    );
  }
}
SortOptions.displayName = "SortOptions";
SortOptions.propTypes = {
  selectedCol: PropTypes.string,
  sortInfo: PropTypes.array,
  t: PropTypes.func,
};
export default withTranslation("column_menu")(SortOptions);
