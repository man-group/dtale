import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { ColumnDef } from '../../../dtale/DataViewerState';
import { BaseOption } from '../../../redux/state/AppState';

import FilterSelect from './FilterSelect';

/** Gelocation options */
interface CoordVals {
  latCol?: BaseOption<string>;
  lonCol?: BaseOption<string>;
}

/**
 * Determine whether a dataset's columns contains coordinate data.
 *
 * @param col the selected column
 * @param columns the columns definitions for a dataset
 * @return true if the dataset contains columns for latitude & longitude, false otherwise.
 */
export function hasCoords(col: string, columns: ColumnDef[]): boolean {
  const colCfg = columns.find((column) => column.name === col);
  if (colCfg?.coord) {
    return columns.find((column) => column.coord === (colCfg?.coord === 'lat' ? 'lon' : 'lat')) !== undefined;
  }
  return false;
}

/**
 * Load default selections for latitude & longitude from a dataset's columns.
 *
 * @param col the selected column
 * @param columns the columns definitions for a dataset
 * @return default selections for latitude and longitude.
 */
export function loadCoordVals(col: string, columns: ColumnDef[]): CoordVals {
  const colCfg = columns.find((column) => column.name === col);
  let latCol = null;
  let lonCol = null;
  if (colCfg?.coord === 'lat') {
    latCol = col;
    lonCol = columns.find((column) => column.coord === 'lon')?.name;
  } else if (colCfg?.coord === 'lon') {
    latCol = columns.find((column) => column.coord === 'lat')?.name;
    lonCol = col;
  }
  return { latCol: latCol ? { value: latCol } : undefined, lonCol: lonCol ? { value: lonCol } : undefined };
}

/** Component properties fro GeoFilters */
export interface GeoFiltersProps {
  col: string;
  columns: ColumnDef[];
  setLatCol: (value?: BaseOption<string>) => void;
  setLonCol: (value?: BaseOption<string>) => void;
  latCol?: BaseOption<string>;
  lonCol?: BaseOption<string>;
}

const GeoFilters: React.FC<GeoFiltersProps & WithTranslation> = ({
  col,
  columns,
  setLatCol,
  setLonCol,
  latCol,
  lonCol,
  t,
}) => {
  const coordType = columns.find((column) => column.name === col)?.coord;
  let latInput;
  let lonInput;
  if (coordType === 'lat') {
    latInput = <div className="mt-auto mb-auto">{col}</div>;
    const lonCols = columns.filter((column) => column.coord === 'lon');
    if (lonCols.length === 1) {
      lonInput = <div className="mt-auto mb-auto">{lonCols[0].name}</div>;
    } else {
      lonInput = (
        <div data-testid="lon-input">
          <FilterSelect<string>
            value={lonCol}
            options={lonCols.map((c) => ({ value: c.name }))}
            onChange={(v?: BaseOption<string> | Array<BaseOption<string>>) =>
              setLonCol((v as BaseOption<string>) ?? undefined)
            }
            noOptionsMessage={() => t('No columns found')}
            isClearable={true}
          />
        </div>
      );
    }
  } else {
    lonInput = <div className="mt-auto mb-auto">{col}</div>;
    const latCols = columns.filter((column) => column.coord === 'lat');
    if (latCols.length === 1) {
      latInput = <div className="mt-auto mb-auto">{latCols[0].name}</div>;
    } else {
      latInput = (
        <div data-testid="lat-input">
          <FilterSelect
            value={latCol}
            options={latCols.map((c) => ({ value: c.name }))}
            onChange={(v?: BaseOption<string> | Array<BaseOption<string>>) =>
              setLatCol((v as BaseOption<string>) ?? undefined)
            }
            noOptionsMessage={() => t('No columns found')}
            isClearable={true}
          />
        </div>
      );
    }
  }
  return (
    <React.Fragment>
      <b className="pl-5 pr-5 mt-auto mb-auto">{t('Latitude')}:</b>
      {latInput}
      <b className="pl-5 pr-5 mt-auto mb-auto">{t('Longitude')}:</b>
      {lonInput}
    </React.Fragment>
  );
};
export default withTranslation('analysis')(GeoFilters);
