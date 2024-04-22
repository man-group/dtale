import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BouncerWrapper } from '../../BouncerWrapper';
import { ColumnDef } from '../../dtale/DataViewerState';
import { useAppSelector } from '../../redux/hooks';
import { selectDataId } from '../../redux/selectors';
import { BaseOption } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as DuplicatesRepository from '../../repository/DuplicatesRepository';
import ColumnSelect from '../create/ColumnSelect';

import {
  BaseDuplicatesComponentProps,
  DuplicatesActionType,
  DuplicatesConfigType,
  KeepType,
  RowsConfig,
  RowsResult,
} from './DuplicatesState';
import Keep from './Keep';

export const validateRowsCfg = (cfg: RowsConfig): string | undefined =>
  !cfg.subset?.length ? 'Missing a column selection!' : undefined;

/** Component properties for Rows */
export interface RowsProps extends BaseDuplicatesComponentProps {
  columns: ColumnDef[];
  selectedCol?: string;
}

/** Response type definition for testing Rows config */
type TestType = DuplicatesRepository.DuplicatesResponse<RowsResult>;

const Rows: React.FC<RowsProps & WithTranslation> = ({ columns, selectedCol, setCfg, t }) => {
  const dataId = useAppSelector(selectDataId);
  const [keep, setKeep] = React.useState(KeepType.FIRST);
  const [subset, setSubset] = React.useState<Array<BaseOption<string>> | undefined>(
    selectedCol ? [{ value: selectedCol }] : undefined,
  );
  const [testOutput, setTestOutput] = React.useState<React.ReactNode>();
  const [loadingTest, setLoadingTest] = React.useState(false);

  const buildCfg = (): RowsConfig => ({ keep, subset: subset?.map(({ value }) => value) });

  React.useEffect(() => {
    setCfg({ type: DuplicatesConfigType.ROWS, cfg: buildCfg() });
  }, [keep, subset]);

  const test = (): void => {
    setLoadingTest(true);
    const cfg = buildCfg();
    DuplicatesRepository.run<TestType>(dataId, {
      type: DuplicatesConfigType.ROWS,
      cfg: buildCfg(),
      action: DuplicatesActionType.TEST,
    }).then((response) => {
      setLoadingTest(false);
      if (response?.error) {
        setTestOutput(<RemovableError {...response} />);
        setLoadingTest(false);
        return;
      }
      let result: React.ReactNode = `${t('No duplicate rows exist for the column(s)')}: ${
        cfg.subset?.join(', ') ?? ''
      }`;
      if (!cfg.subset?.length) {
        result = t('No duplicate rows exist');
      }
      if (response?.results && response.results.removed) {
        result = (
          <React.Fragment>
            <span className="pr-3">{t('From')}</span>
            <b>{response.results.total}</b>
            <span className="pl-2">{` ${t('rows')}:`}</span>
            <ul>
              <li>
                <b>{response.results.removed}</b>
                {t(` ${cfg.subset ? `(${cfg.subset?.join(', ')}) ` : ''}duplicate rows will be removed`)}
              </li>
              <li>
                <b>{response.results.remaining}</b>
                {t(' rows will remain')}
              </li>
            </ul>
          </React.Fragment>
        );
      }
      setTestOutput(result);
    });
  };

  return (
    <React.Fragment>
      <Keep value={keep} setKeep={setKeep} />
      <ColumnSelect
        label={t('Column(s)')}
        prop="subset"
        parent={{ subset }}
        updateState={(state: { subset?: Array<BaseOption<string>> }) => setSubset(state.subset)}
        columns={columns}
        isMulti={true}
      />
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
          <div className="input-group d-block">
            <BouncerWrapper showBouncer={loadingTest}>{testOutput}</BouncerWrapper>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('duplicate')(Rows);
