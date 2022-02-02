import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { VoidFunc } from './dataViewerMenuUtils';
import { MenuItem } from './MenuItem';

/** Component properties for ExportOption */
interface ExportOptionProps {
  open: (fileType: string) => VoidFunc;
}

const ExportOption: React.FC<ExportOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem style={{ color: '#565b68' }} description={t('menu_description:export')}>
    <span className="toggler-action">
      <i className="far fa-file" />
    </span>
    <span className="font-weight-bold pl-2">{t('Export', { ns: 'menu' })}</span>
    <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting">
      {[
        ['CSV', 'csv'],
        ['TSV', 'tsv'],
        ['Parquet', 'parquet'],
      ].map(([label, fileType]) => (
        <button
          key={label}
          style={{ color: '#565b68' }}
          className="btn btn-primary font-weight-bold"
          onClick={open(fileType)}
        >
          {t(label, { ns: 'menu' })}
        </button>
      ))}
    </div>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(ExportOption);
