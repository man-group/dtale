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
  ShowDuplicatesConfig,
  ShowDuplicatesResult,
} from './DuplicatesState';

export const validateShowDuplicatesCfg = (cfg: ShowDuplicatesConfig): string | undefined =>
  !cfg.group?.length ? 'Missing a group selection!' : undefined;

/** Component properties for ShowDuplicates */
export interface ShowDuplicatesProps extends BaseDuplicatesComponentProps {
  columns: ColumnDef[];
}

/** Response type definition for testing ShowDuplicates config */
type TestType = DuplicatesRepository.DuplicatesResponse<ShowDuplicatesResult> & { cfg: ShowDuplicatesConfig };

const ShowDuplicates: React.FC<ShowDuplicatesProps & WithTranslation> = ({ columns, setCfg, t }) => {
  const dataId = useAppSelector(selectDataId);
  const [group, setGroup] = React.useState<Array<BaseOption<string>>>();
  const [filter, setFilter] = React.useState<string>();
  const [testOutput, setTestOutput] = React.useState<TestType>();
  const [loadingTest, setLoadingTest] = React.useState(false);

  const buildCfg = (): ShowDuplicatesConfig => ({
    filter: filter ? testOutput?.results[filter].filter : undefined,
    group: group?.map(({ value }) => value),
  });

  React.useEffect(() => {
    setCfg({ type: DuplicatesConfigType.SHOW, cfg: buildCfg() });
  }, [group, filter]);

  const test = (): void => {
    setLoadingTest(true);
    const cfg = buildCfg();
    DuplicatesRepository.run<TestType>(dataId, {
      type: DuplicatesConfigType.SHOW,
      cfg,
      action: DuplicatesActionType.TEST,
    }).then((response) => {
      setLoadingTest(false);
      setTestOutput({ ...response, cfg } as TestType);
      setFilter(undefined);
    });
  };

  const renderTestOutput = (): React.ReactNode => {
    const cfg = buildCfg();
    if (!testOutput) {
      return null;
    }
    if (testOutput.error) {
      return <RemovableError {...testOutput} />;
    }
    if (Object.keys(testOutput.results).length) {
      return (
        <React.Fragment>
          <span>{`${t('Duplicates exist for the following')} (${testOutput.cfg.group?.join(', ')}) ${t('groups')}:`}</span>
          <br />
          <b>Total Duplicates</b>
          {`: ${Object.values(testOutput.results).reduce((res, { count }) => res + count, 0)}`}
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <ul>
              {Object.keys(testOutput.results).map((key, i) => (
                <li key={i}>
                  {Object.keys(testOutput.results).length > 1 && (
                    <i
                      className={`ico-check-box${filter === key ? '' : '-outline-blank'} pointer pb-2 pr-3`}
                      onClick={() => setFilter(filter === key ? undefined : key)}
                    />
                  )}
                  <b>{key}</b>
                  {`: ${testOutput.results[key].count}`}
                </li>
              ))}
            </ul>
          </div>
        </React.Fragment>
      );
    }
    return `${t('No duplicates exist in any of the')} (${cfg.group?.join(', ')}) ${t('groups')}`;
  };

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Column(s)')}
        prop="group"
        parent={{ group }}
        updateState={(state) => {
          setGroup(state.group as Array<BaseOption<string>>);
          setFilter(undefined);
        }}
        columns={columns}
        isMulti={true}
        selectAll={true}
      />
      <div className="form-group row">
        <div className="col-md-3" />
        <div className="col-md-8">
          {!!group?.length && (
            <button className="col-auto btn btn-secondary" onClick={test} data-testid="view-duplicates">
              {t('View Duplicates')}
            </button>
          )}
        </div>
      </div>
      <div className="form-group row">
        <div className="col-md-3" />
        <div className="col-md-8">
          <div className="input-group d-block">
            <BouncerWrapper showBouncer={loadingTest}>{renderTestOutput()}</BouncerWrapper>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('duplicate')(ShowDuplicates);
