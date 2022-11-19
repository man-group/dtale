import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import { Bouncer } from '../../Bouncer';
import ButtonToggle from '../../ButtonToggle';
import { ColumnDef } from '../../dtale/DataViewerState';
import { ColumnType, findColType, noFilters } from '../../dtale/gridUtils';
import { JSAnchor } from '../../JSAnchor';
import * as actions from '../../redux/actions/dtale';
import * as settingsActions from '../../redux/actions/settings';
import { AppState, InstanceSettings } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as ColumnFilterRepository from '../../repository/ColumnFilterRepository';
import * as DescribeRepository from '../../repository/DescribeRepository';
import FilterableToggle from '../FilterableToggle';

import { DetailData, OutliersData, UniqueRecord } from './DescribeState';
import { DetailsCharts } from './DetailsCharts';
import Uniques from './Uniques';

/** Different views of deep data */
enum DeepDataView {
  UNIQUES = 'uniques',
  OUTLIERS = 'outliers',
  DIFFS = 'diffs',
}

/** Component properties for Details */
export interface DetailsProps {
  selected: ColumnDef;
  dtypes: ColumnDef[];
  close?: JSX.Element;
}

const Details: React.FC<DetailsProps & WithTranslation> = ({ selected, dtypes, close, t }) => {
  const { dataId, settings } = useSelector((state: AppState) => ({ dataId: state.dataId, settings: state.settings }));
  const dispatch = useDispatch();
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): AnyAction =>
    dispatch(settingsActions.updateSettings(updatedSettings) as any as AnyAction);

  const deepDataOptions = React.useMemo(
    () => [
      { value: DeepDataView.UNIQUES, label: t('Uniques') },
      { value: DeepDataView.OUTLIERS, label: t('Outliers') },
      { value: DeepDataView.DIFFS, label: t('Diffs') },
    ],
    [t],
  );

  const preExistingFilters = React.useMemo(() => {
    const { query, columnFilters, outlierFilters, predefinedFilters } = settings;
    return !noFilters({ query, columnFilters, outlierFilters, predefinedFilters });
  }, [settings]);
  const [error, setError] = React.useState<JSX.Element>();
  const [details, setDetails] = React.useState<DetailData>();
  const [code, setCode] = React.useState<string>();
  const [deepData, setDeepData] = React.useState<DeepDataView>(DeepDataView.UNIQUES);
  const [viewWordValues, setViewWordValues] = React.useState(false);
  const [wordValues, setWordValues] = React.useState<UniqueRecord[]>();
  const [outliers, setOutliers] = React.useState<OutliersData>();
  const [loadingOutliers, setLoadingOutliers] = React.useState(false);
  const [filtered, setFiltered] = React.useState(preExistingFilters);

  const loadDetails = async (): Promise<void> => {
    if (!selected) {
      return undefined;
    }
    const response = await DescribeRepository.load(dataId, selected.name, filtered);
    if (response?.error) {
      setError(<RemovableError {...response} />);
      return;
    }
    if (response) {
      setError(undefined);
      setOutliers(undefined);
      setDeepData(DeepDataView.UNIQUES);
      setViewWordValues(false);
      setWordValues(undefined);
      setDetails(response);
      setCode(response.code);
    }
  };

  React.useEffect(() => {
    if (selected) {
      loadDetails();
    }
  }, [selected, filtered]);

  const loadOutliers = (): void => {
    setLoadingOutliers(true);
    DescribeRepository.loadOutliers(dataId, selected.name, filtered).then((response) => {
      setLoadingOutliers(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
      } else if (response) {
        setOutliers(response);
      }
    });
  };

  const renderDeepDataToggle = (): React.ReactNode => {
    const colType = findColType(selected.dtype);
    if ([ColumnType.FLOAT, ColumnType.INT].includes(colType)) {
      return (
        <div className="row pb-5">
          <div className="col-auto pl-0">
            <ButtonToggle
              options={deepDataOptions}
              defaultValue={deepData}
              update={(val: DeepDataView) => {
                setDeepData(val);
                if (!outliers && val === DeepDataView.OUTLIERS && !loadingOutliers) {
                  loadOutliers();
                }
              }}
            />
          </div>
        </div>
      );
    } else if (colType === 'date') {
      return (
        <div className="row pb-5">
          <div className="col-auto pl-0">
            <ButtonToggle
              options={deepDataOptions.filter(({ value }) => value !== DeepDataView.OUTLIERS)}
              defaultValue={deepData}
              update={setDeepData}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  const renderUniques = (): React.ReactNode => {
    if (viewWordValues) {
      return <Uniques uniques={{ data: wordValues ?? [] }} baseTitle="Word" />;
    }
    if (details?.uniques) {
      const uniques = details.uniques;
      const dtypeCt = Object.keys(uniques).length;
      return Object.entries(uniques).map(([dtype, dtypeUniques]) => (
        <Uniques key={dtype} uniques={dtypeUniques} dtype={dtypeCt > 1 ? dtype : undefined} />
      ));
    }
    return null;
  };

  const saveFilter = async (): Promise<void> => {
    if (outliers) {
      setOutliers({ ...outliers, queryApplied: !outliers?.queryApplied });
      ColumnFilterRepository.toggleOutlierFilter(dataId, selected.name).then((response) => {
        if (response && !response?.error) {
          updateSettings({ outlierFilters: response.outlierFilters });
          if (actions.isPopup()) {
            window.opener.location.reload();
          }
        }
      });
    }
  };

  const renderOutliers = (): React.ReactNode => {
    if (loadingOutliers) {
      return <Bouncer />;
    }
    if (!outliers) {
      return undefined;
    }
    const outlierValues = outliers.outliers;
    if (!outlierValues.length) {
      return (
        <div className="row">
          <div className="col-sm-12">
            <span className="font-weight-bold" style={{ fontSize: '120%' }}>
              {t('No Outliers Detected')}
            </span>
          </div>
        </div>
      );
    }
    return (
      <React.Fragment>
        <div className="row">
          <div className="col">
            <span className="font-weight-bold" style={{ fontSize: '120%' }}>
              {`${outlierValues.length} ${t('Outliers Found')}${outliers.top ? ` (${t('top 100')})` : ''}:`}
            </span>
            <JSAnchor onClick={saveFilter} className="d-block">
              <span className="pr-3">{`${outliers.queryApplied ? 'Remove' : 'Apply'} outlier filter:`}</span>
              <span className="font-weight-bold">{outliers.query}</span>
            </JSAnchor>
          </div>
          <div className="col-auto">
            <div className="hoverable" style={{ borderBottom: 'none' }}>
              <i className="ico-code pr-3" />
              <span>{t('View Code')}</span>
              <div className="hoverable__content" style={{ width: 'auto' }}>
                <pre className="mb-0">{outliers.code}</pre>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12">
            <span>{outlierValues.join(', ')}</span>
          </div>
        </div>
      </React.Fragment>
    );
  };

  if (error) {
    return (
      <div className="row">
        <div className="col-sm-12">{error}</div>
      </div>
    );
  }
  if (!Object.keys(details ?? {}).length) {
    return null;
  }
  return (
    <React.Fragment>
      {details && (
        <div data-testid="details">
          <div className="row">
            <div className="col">
              <span className="mb-0 font-weight-bold" style={{ fontSize: '2em' }}>
                {selected.name}
              </span>
              <span className="pl-3">({selected.dtype})</span>
              <small className="d-block pl-2 pb-3" style={{ marginTop: '-8px' }}>
                ({t('navigate')})
              </small>
            </div>
            <FilterableToggle
              hasFilters={preExistingFilters}
              filtered={filtered}
              propagateState={(state) => setFiltered(state.filtered)}
              className="pr-0"
            />
            {close}
          </div>
          <DetailsCharts
            details={details}
            detailCode={code}
            dtype={selected.dtype}
            cols={dtypes}
            col={selected.name}
            propagateState={(state) => {
              setViewWordValues(state.viewWordValues);
              setWordValues(state.wordValues);
            }}
            filtered={filtered}
          />
          {renderDeepDataToggle()}
          {deepData === DeepDataView.UNIQUES && renderUniques()}
          {deepData === DeepDataView.DIFFS && details?.sequential_diffs.diffs && (
            <Uniques uniques={details.sequential_diffs.diffs} baseTitle="Sequential Difference" />
          )}
          {deepData === DeepDataView.OUTLIERS && renderOutliers()}
        </div>
      )}
    </React.Fragment>
  );
};

export default withTranslation('describe')(Details);
