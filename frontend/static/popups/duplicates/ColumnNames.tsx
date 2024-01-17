import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BouncerWrapper } from '../../BouncerWrapper';
import { useAppSelector } from '../../redux/hooks';
import { selectDataId } from '../../redux/selectors';
import { RemovableError } from '../../RemovableError';
import * as DuplicatesRepository from '../../repository/DuplicatesRepository';

import {
  BaseDuplicatesComponentProps,
  ColumnBasedResult,
  DuplicatesActionType,
  DuplicatesConfigType,
  KeepType,
} from './DuplicatesState';
import Keep from './Keep';

/** Response type definition for testing ColumnNames config */
type TestType = DuplicatesRepository.DuplicatesResponse<ColumnBasedResult>;

const ColumnNames: React.FC<BaseDuplicatesComponentProps & WithTranslation> = ({ setCfg, t }) => {
  const dataId = useAppSelector(selectDataId);
  const [keep, setKeep] = React.useState(KeepType.FIRST);
  const [testOutput, setTestOutput] = React.useState<React.ReactNode>();
  const [loadingTest, setLoadingTest] = React.useState(false);

  React.useEffect(() => {
    setCfg({ type: DuplicatesConfigType.COLUMN_NAMES, cfg: { keep } });
  }, [keep]);

  const test = (): void => {
    setLoadingTest(true);
    DuplicatesRepository.run<TestType>(dataId, {
      type: DuplicatesConfigType.COLUMN_NAMES,
      cfg: { keep },
      action: DuplicatesActionType.TEST,
    }).then((response) => {
      setLoadingTest(false);
      if (response?.error) {
        setTestOutput(<RemovableError {...response} />);
        setLoadingTest(false);
        return;
      }
      let result: React.ReactNode = t('No duplicate column names exist.');
      if (response?.results && Object.keys(response.results).length) {
        result = (
          <ul>
            {Object.keys(response.results).map((string) => (
              <li key={string}>
                <b>{string}</b>
                {t(' matches columns ')}
                <b>{response.results[string].join(', ')}</b>
              </li>
            ))}
          </ul>
        );
      }
      setTestOutput(result);
    });
  };

  return (
    <React.Fragment>
      <Keep value={keep} setKeep={setKeep} />
      <div className="form-group row">
        <div className="col-md-3" />
        <div className="col-md-8">
          <button className="col-auto btn btn-secondary" onClick={test}>
            {t('View Duplicates')}
          </button>
        </div>
      </div>
      <div className="form-group row">
        <div className="col-md-3" />
        <div className="col-md-8">
          <div className="input-group">
            <BouncerWrapper showBouncer={loadingTest}>{testOutput}</BouncerWrapper>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('duplicate')(ColumnNames);
