import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { BouncerWrapper } from '../../BouncerWrapper';
import ButtonToggle from '../../ButtonToggle';
import FilterSelect from '../../popups/analysis/filters/FilterSelect';
import ColumnSelect from '../../popups/create/ColumnSelect';
import { ActionType, HideSidePanelAction } from '../../redux/actions/AppActions';
import { buildURLString } from '../../redux/actions/url-utils';
import { AppState, BaseOption } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as DtypesRepository from '../../repository/DtypesRepository';
import { capitalize } from '../../stringUtils';
import { ColumnDef } from '../DataViewerState';
import * as gu from '../gridUtils';
import * as menuFuncs from '../menu/dataViewerMenuUtils';

require('./MissingNoCharts.css');

/** Different MissingNo charts */
export enum MissingNoChart {
  HEATMAP = 'heatmap',
  BAR = 'bar',
  DENDOGRAM = 'dendrogram',
  MATRIX = 'matrix',
}

const buildUrls = (
  dataId: string,
  dateCol: BaseOption<string> | undefined,
  freq: BaseOption<string>,
  chartType: MissingNoChart,
): string[] => {
  const imageUrl = buildURLString(menuFuncs.fullPath(`/dtale/missingno/${chartType}`, dataId), {
    date_index: dateCol?.value ?? '',
    freq: freq.value,
    id: `${new Date().getTime()}`,
  });
  const fileUrl = buildURLString(menuFuncs.fullPath(`/dtale/missingno/${chartType}`, dataId), {
    date_index: dateCol?.value ?? '',
    freq: freq.value,
    file: 'true',
    id: `${new Date().getTime()}`,
  });
  return [imageUrl, fileUrl];
};

const FREQS = [
  ...['B', 'C', 'D', 'W', 'M', 'SM', 'BM', 'CBM', 'MS', 'SMS', 'BMS', 'CBMS', 'Q', 'BQ', 'QS', 'BQS', 'Y', 'BY'],
  ...['YS', 'BYS', 'BH', 'H', 'T', 'S', 'L', 'U', 'N'],
];

const MissingNoCharts: React.FC<WithTranslation> = ({ t }) => {
  const dataId = useSelector((state: AppState) => state.dataId);
  const dispatch = useDispatch();
  const hideSidePanel = (): HideSidePanelAction => dispatch({ type: ActionType.HIDE_SIDE_PANEL });

  const [chartOptions, freqOptions] = React.useMemo(
    () => [
      Object.values(MissingNoChart).map((value) => ({ value, label: t(`missing:${capitalize(value)}`) })),
      FREQS.map((f) => ({ label: `${f} - ${t(f, { ns: 'missing' })}`, value: f })) as Array<BaseOption<string>>,
    ],
    [t],
  );

  const [error, setError] = React.useState<JSX.Element>();
  const [chartType, setChartType] = React.useState(MissingNoChart.HEATMAP);
  const [freq, setFreq] = React.useState(freqOptions.find((f) => f.value === 'BQ')!);
  const [dateCol, setDateCol] = React.useState<BaseOption<string>>();
  const [dateCols, setDateCols] = React.useState<ColumnDef[]>([]);
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageUrl, setImageUrl] = React.useState<string>();
  const [fileUrl, setFileUrl] = React.useState<string>();

  React.useEffect(() => {
    DtypesRepository.loadDtypes(dataId).then((response) => {
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      if (response) {
        const currentDateCols = response.dtypes.filter((col) => gu.isDateCol(col.dtype));
        setDateCols(currentDateCols);
        setDateCol(currentDateCols.length ? { value: currentDateCols[0].name } : undefined);
      }
    });
  }, []);

  React.useEffect(() => {
    const urls = buildUrls(dataId, dateCol, freq, chartType);
    setImageLoading(true);
    setImageUrl(urls[0]);
    setFileUrl(urls[1]);
  }, [dateCol, freq, chartType]);

  return (
    <>
      {error}
      <div className="row ml-0 mr-0">
        <div className="col-auto pl-0">
          <h2>{t('Missing Analysis', { ns: 'menu' })}</h2>
        </div>
        <div className="col" />
        <div className="col-auto pr-0">
          <button className="btn btn-plain" onClick={() => window.open(imageUrl, '_blank')}>
            <i className="ico-open-in-new pointer" title={t('Open In New Tab', { ns: 'side' }) ?? undefined} />
          </button>
        </div>
        <div className="col-auto pr-0">
          <button className="btn btn-plain" onClick={() => window.open(fileUrl, '_blank')}>
            <i className="fas fa-file-code pointer" title={t('missing:Download') ?? undefined} />
          </button>
        </div>
        <div className="col-auto">
          <button className="btn btn-plain" onClick={hideSidePanel}>
            <i className="ico-close pointer" title={t('side:Close') ?? undefined} />
          </button>
        </div>
      </div>
      <div className="row ml-0 mr-0 missingno-inputs">
        <ButtonToggle
          options={chartOptions}
          update={(value) => setChartType(value)}
          defaultValue={chartType}
          disabled={imageLoading}
        />
        {dateCols.length > 0 && chartType === MissingNoChart.MATRIX && (
          <>
            <div className="col-auto">
              <ColumnSelect
                label={t('builders:Date')}
                prop="dateCol"
                parent={{ dateCol }}
                updateState={(updates: { dateCol?: BaseOption<string> }) => setDateCol(updates.dateCol)}
                columns={dateCols}
              />
            </div>
            <div className="col-auto">
              <div className="form-group row">
                <label className="col-md-3 col-form-label text-right">{t('missing:Freq')}</label>
                <div className="col-md-8">
                  <div className="input-group">
                    <FilterSelect<string>
                      value={freq}
                      options={freqOptions}
                      onChange={(v?: BaseOption<string> | Array<BaseOption<string>>) =>
                        setFreq(v as BaseOption<string>)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        <div className="col" />
      </div>
      <div className="row h-100">
        <BouncerWrapper showBouncer={imageLoading}>{null}</BouncerWrapper>
        <div className="col image-frame" hidden={imageLoading}>
          <img
            src={imageUrl}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setError(<RemovableError error="Chart could not be loaded!" />);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default withTranslation(['menu', 'missing', 'side', 'builders'])(MissingNoCharts);
