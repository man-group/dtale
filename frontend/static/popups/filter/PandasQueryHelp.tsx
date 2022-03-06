import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

const PandasQueryHelp: React.FC<WithTranslation> = ({ t }) => (
  <button
    className="btn btn-secondary"
    onClick={(e) => {
      e.preventDefault();
      window.open(
        'https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#indexing-query',
        undefined,
        'titlebar=1,location=1,status=1,width=990,height=450',
      );
    }}
  >
    <span>{t('Help')}</span>
  </button>
);

export default withTranslation('filter')(PandasQueryHelp);
