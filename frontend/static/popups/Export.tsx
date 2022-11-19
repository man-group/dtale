import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import ButtonToggle from '../ButtonToggle';
import { fullPath } from '../dtale/menu/dataViewerMenuUtils';
import { CloseChartAction } from '../redux/actions/AppActions';
import { closeChart } from '../redux/actions/charts';
import { buildURL } from '../redux/actions/url-utils';
import { AppState, ExportPopupData } from '../redux/state/AppState';
import { ENDPOINT as DATA_ENDPOINT } from '../repository/DataRepository';
import { ExportThumb, SingleTrack, StyledSlider } from '../sliderUtils';

/** Export file types */
export enum ExportType {
  CSV = 'csv',
  TSV = 'tsv',
  PARQUET = 'parquet',
}

/** HTML Export file types */
enum HTMLExportType {
  HTML = 'html',
}

const Export: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, chartData, settings } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    chartData: state.chartData as ExportPopupData,
    settings: state.settings,
  }));
  const dispatch = useDispatch();
  const onClose = (): CloseChartAction => dispatch(closeChart(chartData));

  const exportFile = (exportType: ExportType): void => {
    window.open(`${fullPath('/dtale/data-export', dataId)}?type=${exportType}&_id=${new Date().getTime()}`, '_blank');
    onClose();
  };

  const buttons = React.useMemo(
    () => [
      {
        value: ExportType.CSV,
        label: t('CSV', { ns: 'export' }),
        buttonOptions: { onClick: () => exportFile(ExportType.CSV) },
      },
      {
        value: ExportType.TSV,
        label: t('TSV', { ns: 'export' }),
        buttonOptions: { onClick: () => exportFile(ExportType.TSV) },
      },
      {
        value: ExportType.PARQUET,
        label: t('Parquet', { ns: 'export' }),
        buttonOptions: { onClick: () => exportFile(ExportType.PARQUET) },
      },
      {
        value: HTMLExportType.HTML,
        label: t(HTMLExportType.HTML, { ns: 'export' }),
      },
    ],
    [t],
  );

  const [htmlType, setHtmlType] = React.useState<HTMLExportType>();
  const [rows, setRows] = React.useState<number>(chartData.rows);

  const exportHTML = (): void => {
    const url = buildURL(fullPath(DATA_ENDPOINT, dataId), {
      sortInfo: settings.sortInfo,
      export: true,
      export_rows: rows,
      _id: new Date().getTime(),
    });
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div key="body" className="modal-body">
      <div className="form-group row">
        <label className="col-md-2 col-form-label text-right">{t('Type')}</label>
        <div className="col-md-10 pl-0">
          <ButtonToggle
            options={buttons}
            update={(value: HTMLExportType) => {
              if (chartData.rows > 10000) {
                setHtmlType(value);
              } else {
                exportHTML();
              }
            }}
            defaultValue={htmlType}
            compact={false}
          />
        </div>
      </div>
      {htmlType && chartData.rows > 10000 && (
        <React.Fragment>
          <div className="form-group row">
            <label className="col-md-2 col-form-label text-right">{t('Rows')}</label>
            <div className="col-md-10 pl-0">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control mr-4 slider-input"
                  value={`${rows}`}
                  onChange={(e) => setRows(parseInt(e.target.value, 10))}
                  style={{ width: '3.5em' }}
                />
                <StyledSlider
                  defaultValue={rows}
                  renderTrack={SingleTrack as any}
                  renderThumb={ExportThumb}
                  max={chartData.rows}
                  value={rows}
                  onAfterChange={(updatedRows) => setRows(updatedRows as number)}
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <small>{t('rows_desc')}</small>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12 text-right">
              <button className="btn btn-primary" onClick={exportHTML} data-testid="export-html">
                <i className="far fa-file pr-3" />
                <span>{t('Export HTML')}</span>
              </button>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default withTranslation('export')(Export);
