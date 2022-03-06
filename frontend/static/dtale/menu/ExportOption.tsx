import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { default as ButtonToggle, ButtonToggleOption } from '../../ButtonToggle';

import { VoidFunc } from './dataViewerMenuUtils';
import { MenuItem } from './MenuItem';

/** Export file types */
export enum ExportType {
  CSV = 'csv',
  TSV = 'tsv',
  PARQUET = 'parquet',
}

/** Component properties for ExportOption */
interface ExportOptionProps {
  open: (exportType: ExportType) => VoidFunc;
}

const ExportOption: React.FC<ExportOptionProps & WithTranslation> = ({ open, t }) => {
  const exportOptions: ButtonToggleOption[] = React.useMemo(
    () => [
      {
        value: ExportType.CSV,
        label: t('CSV', { ns: 'menu' }),
        className: 'font-weight-bold',
        buttonOptions: { style: { color: '#565b68' } },
      },
      {
        value: ExportType.TSV,
        label: t('TSV', { ns: 'menu' }),
        className: 'font-weight-bold',
        buttonOptions: { style: { color: '#565b68' } },
      },
      {
        value: ExportType.PARQUET,
        label: t('Parquet', { ns: 'menu' }),
        className: 'font-weight-bold',
        buttonOptions: { style: { color: '#565b68' } },
      },
    ],
    [t],
  );

  return (
    <MenuItem style={{ color: '#565b68' }} description={t('menu_description:export')}>
      <span className="toggler-action">
        <i className="far fa-file" />
      </span>
      <span className="font-weight-bold pl-2">{t('Export', { ns: 'menu' })}</span>
      <ButtonToggle
        options={exportOptions}
        update={(exportType) => open(exportType)()}
        compact={true}
        className="ml-auto mr-3 font-weight-bold column-sorting"
      />
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(ExportOption);
