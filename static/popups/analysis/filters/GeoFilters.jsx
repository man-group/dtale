import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import FilterSelect from "./FilterSelect";

export function hasCoords(col, columns) {
  const colCfg = _.find(columns, { name: col }) || {};
  if (colCfg.coord) {
    return _.find(columns, { coord: colCfg.coord === "lat" ? "lon" : "lat" }) !== undefined;
  }
  return false;
}

export function loadCoordVals(col, columns) {
  const colCfg = _.find(columns, { name: col }) || {};
  let latCol = null,
    lonCol = null;
  if (colCfg?.coord === "lat") {
    latCol = col;
    lonCol = _.find(columns, { coord: "lon" })?.name;
  } else if (colCfg?.coord === "lon") {
    latCol = _.find(columns, { coord: "lat" })?.name;
    lonCol = col;
  }
  return { latCol: latCol ? { value: latCol } : null, lonCol: lonCol ? { value: lonCol } : null };
}

class GeoFilters extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { col, columns, update, latCol, lonCol, t } = this.props;
    const coordType = _.find(columns, { name: col })?.coord;
    let latInput, lonInput;
    if (coordType === "lat") {
      latInput = <div className="mt-auto mb-auto">{col}</div>;
      const lonCols = _.filter(columns, { coord: "lon" });
      if (lonCols.length === 1) {
        lonInput = <div className="mt-auto mb-auto">{lonCols[0].name}</div>;
      } else {
        lonInput = (
          <div>
            <FilterSelect
              selectProps={{
                value: lonCol,
                options: _.map(lonCols, c => ({
                  value: c.name,
                })),
                onChange: v => update({ lonCol: v }),
                noOptionsText: () => t("No columns found"),
                isClearable: true,
              }}
            />
          </div>
        );
      }
    } else {
      lonInput = <div className="mt-auto mb-auto">{col}</div>;
      const latCols = _.filter(columns, { coord: "lat" });
      if (latCols.length === 1) {
        latInput = <div className="mt-auto mb-auto">{latCols[0].name}</div>;
      } else {
        latInput = (
          <div>
            <FilterSelect
              selectProps={{
                value: latCol,
                options: _.map(latCols, c => ({
                  value: c.name,
                })),
                onChange: v => update({ latCol: v }),
                noOptionsText: () => t("No columns found"),
                isClearable: true,
              }}
            />
          </div>
        );
      }
    }
    return (
      <React.Fragment>
        <b className="pl-5 pr-5 mt-auto mb-auto">{t("Latitude")}:</b>
        {latInput}
        <b className="pl-5 pr-5 mt-auto mb-auto">{t("Longitude")}:</b>
        {lonInput}
      </React.Fragment>
    );
  }
}
GeoFilters.displayName = "GeoFilters";
GeoFilters.propTypes = {
  col: PropTypes.string,
  columns: PropTypes.array,
  update: PropTypes.func,
  latCol: PropTypes.object,
  lonCol: PropTypes.object,
  t: PropTypes.func,
};
export default withTranslation("analysis")(GeoFilters);
