import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import * as GenericRepository from '../repository/GenericRepository';

const PYPI_API = 'https://pypi.org/pypi/dtale/json';

/** Axios response from pypi's API */
interface PyPiResponse {
  info?: { version?: string };
}

const About: React.FC<WithTranslation> = ({ t }) => {
  const currentVersion = (document.getElementById('version') as HTMLInputElement)?.value;
  const [pypiVersion, setPypiVersion] = React.useState<string>();

  React.useEffect(() => {
    (async () => {
      const response = await GenericRepository.getDataFromService<PyPiResponse>(PYPI_API);
      setPypiVersion(response?.info?.version);
    })();
  }, []);

  return (
    <div key="body" className="modal-body">
      <div className="row">
        <div className="col-md-12">
          <span>{`${t('Your Version')}:`}</span>
          <span className="font-weight-bold pl-5">{currentVersion || ''}</span>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <span>{`${t('PyPi Version')}:`}</span>
          <span className="font-weight-bold pl-5">{pypiVersion || ''}</span>
        </div>
      </div>
      {currentVersion !== pypiVersion && (
        <div className="row">
          <div className="col-md-12">
            <div className="dtale-alert alert alert-danger text-center" role="alert">
              <span>{t('Your version is currently out of sync with PyPi.')}</span>
              <br />
              <span>{t('Please upgrade.')}</span>
            </div>
          </div>
        </div>
      )}
      <div className="row">
        <div className="col-md-12">
          <a
            href={`https://github.com/man-group/dtale/tree/v${currentVersion}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <i className="fab fa-github mr-4" />
            {t('GitHub')}
          </a>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <a href={`https://dtale.readthedocs.io/en/v${currentVersion}`} rel="noopener noreferrer" target="_blank">
            <i className="fas fa-book-open mr-4" />
            {t('readthedocs.io')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default withTranslation('about')(About);
