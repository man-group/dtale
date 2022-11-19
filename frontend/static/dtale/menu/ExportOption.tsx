import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { OpenChartAction } from '../../redux/actions/AppActions';
import * as chartActions from '../../redux/actions/charts';
import { Popups, PopupType } from '../../redux/state/AppState';

import { MenuItem } from './MenuItem';
import { RibbonOptionProps } from './MenuState';

/** Component properties for ExportOption */
interface ExportOptionProps extends RibbonOptionProps {
  rows: number;
}

const ExportOption: React.FC<ExportOptionProps & WithTranslation> = ({ ribbonWrapper = (func) => func, rows, t }) => {
  const dispatch = useDispatch();
  const openChart = (chartData: Popups): OpenChartAction => dispatch(chartActions.openChart(chartData));

  const openExport = ribbonWrapper(() => openChart({ type: PopupType.EXPORT, size: 'sm', visible: true, rows }));

  return (
    <MenuItem style={{ color: '#565b68' }} description={t('menu_description:export')} onClick={openExport}>
      <span className="toggler-action">
        <i className="far fa-file" />
      </span>
      <span className="font-weight-bold pl-2">{t('Export', { ns: 'menu' })}</span>
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(ExportOption);
