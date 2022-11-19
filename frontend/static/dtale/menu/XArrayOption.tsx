import { TFunction } from 'i18next';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { OpenChartAction } from '../../redux/actions/AppActions';
import * as chartActions from '../../redux/actions/charts';
import { AppState, PopupType } from '../../redux/state/AppState';
import { ColumnDef } from '../DataViewerState';

import { MenuItem } from './MenuItem';

const renderDimensionSelection = (dimensionSelection: Record<string, any>, t: TFunction): string => {
  if (Object.keys(dimensionSelection).length) {
    return Object.entries(dimensionSelection)
      .map(([prop, val]) => `${val} (${prop})`)
      .join(', ');
  }
  return t('ALL DATA', { ns: 'menu' });
};

/** Component properties for XArrayOption */
interface XArrayOptionProps {
  columns: ColumnDef[];
}

const XArrayOption: React.FC<XArrayOptionProps & WithTranslation> = ({ columns, t }) => {
  const { xarray, xarrayDim } = useSelector((state: AppState) => ({
    xarray: state.xarray,
    xarrayDim: state.xarrayDim,
  }));
  const dispatch = useDispatch();
  const openXArrayPopup = (type: PopupType.XARRAY_DIMENSIONS | PopupType.XARRAY_INDEXES): OpenChartAction =>
    dispatch(chartActions.openChart({ type, columns, visible: true }));

  if (xarray) {
    return (
      <MenuItem
        description={`${t('menu_description:xarray_dim_des')} ${renderDimensionSelection(xarrayDim, t)}`}
        onClick={() => openXArrayPopup(PopupType.XARRAY_DIMENSIONS)}
      >
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="ico-key" />
            <span className="font-weight-bold">{t('XArray Dimensions', { ns: 'menu' })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
  return (
    <MenuItem
      description={t('menu_description:xarray_conversion')}
      onClick={() => openXArrayPopup(PopupType.XARRAY_INDEXES)}
    >
      <span className="toggler-action">
        <button className="btn btn-plain">
          <i className="ico-tune" />
          <span className="font-weight-bold">{t('Convert To XArray', { ns: 'menu' })}</span>
        </button>
      </span>
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(XArrayOption);
