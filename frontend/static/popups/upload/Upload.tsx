import * as React from 'react';
import Dropzone from 'react-dropzone';
import { withTranslation, WithTranslation } from 'react-i18next';

import { Bouncer } from '../../Bouncer';
import { BouncerWrapper } from '../../BouncerWrapper';
import ButtonToggle from '../../ButtonToggle';
import { useAppSelector } from '../../redux/hooks';
import { selectEnableWebUploads } from '../../redux/selectors';
import { RemovableError } from '../../RemovableError';
import * as UploadRepository from '../../repository/UploadRepository';
import { LabeledInput } from '../create/LabeledInput';

import CSVOptions from './CSVOptions';
import SheetSelector from './SheetSelector';
import { CSVLoaderProps, CSVProps, Dataset, DataType, Sheet } from './UploadState';
import { jumpToDataset } from './uploadUtils';

require('./Upload.css');

const DATASET_LABELS: { [key in Dataset]: string } = {
  [Dataset.COVID]: 'COVID-19',
  [Dataset.SEINFELD]: 'Seinfeld',
  [Dataset.SIMPSONS]: 'The Simpsons',
  [Dataset.VIDEO_GAMES]: 'Video Games',
  [Dataset.MOVIES]: 'Movies',
  [Dataset.TIME_DATAFRAME]: 'makeTimeDataFrame',
};

export const DISABLED_URL_UPLOADS_MSG = [
  'Web uploads are currently disabled.  This feature is only for trusted environments, in order to unlock this ',
  'feature you must do one of the following:',
].join('');

/** Component properties for Upload */
interface UploadProps {
  mergeRefresher?: () => Promise<void>;
}

const Upload: React.FC<UploadProps & WithTranslation> = ({ mergeRefresher, t }) => {
  const enableWebUploads = useAppSelector(selectEnableWebUploads);
  const [dataType, setDataType] = React.useState<DataType>();
  const [url, setUrl] = React.useState<string>();
  const [proxy, setProxy] = React.useState<string>();
  const [loadingDataset, setLoadingDataset] = React.useState<Dataset>();
  const [datasetDescription, setDatasetDescription] = React.useState<string>();
  const [loading, setLoading] = React.useState(false);
  const [loadingURL, setLoadingURL] = React.useState(false);
  const [error, setError] = React.useState<JSX.Element>();
  const [sheets, setSheets] = React.useState<Sheet[]>();
  const [csvProps, setCsvProps] = React.useState<CSVProps>({ show: false });

  const handleResponse = (response?: UploadRepository.UploadResponse): void => {
    if (response?.error) {
      setError(<RemovableError {...response} />);
      setLoading(false);
      setLoadingURL(false);
      setLoadingDataset(undefined);
      setCsvProps({ show: false });
      return;
    }
    if (response?.sheets) {
      setLoading(false);
      setSheets(response.sheets.map((sheet) => ({ ...sheet, selected: true })));
      setCsvProps({ show: false });
      return;
    }
    if (response?.data_id) {
      jumpToDataset(response.data_id, mergeRefresher);
    }
  };

  const loadFromWeb = async (): Promise<void> => {
    setLoadingURL(true);
    handleResponse(await UploadRepository.webUpload(dataType!, url!, proxy));
  };

  const loadDataset = async (dataset: Dataset): Promise<void> => {
    setLoadingDataset(dataset);
    handleResponse(await UploadRepository.presetUpload(dataset));
  };

  return (
    <div key="body" className="modal-body" data-testid="upload">
      <h3>{t('Load File')}</h3>
      <div className="row">
        <div className="col-md-12">
          <Dropzone
            onDrop={async (files): Promise<void> => {
              const fd = new FormData();
              let hasCSV = false;
              files.forEach((file) => {
                fd.append(file.name, file);
                if (file.name.endsWith('csv')) {
                  hasCSV = true;
                }
              });
              setLoading(true);
              const postUpload = async (loaderProps?: CSVLoaderProps): Promise<void> => {
                Object.entries(loaderProps ?? {}).map(([key, value]) => {
                  fd.append(key, value);
                });
                handleResponse(await UploadRepository.upload(fd));
              };
              if (hasCSV) {
                setCsvProps({ show: true, loader: postUpload });
              } else {
                postUpload();
              }
            }}
            disabled={false}
            maxSize={Infinity}
            minSize={0}
            multiple={false}
            // activeStyle={{
            //   borderStyle: 'solid',
            //   borderColor: '#6c6',
            //   backgroundColor: '#eee',
            // }}
            // rejectStyle={{
            //   borderStyle: 'solid',
            //   borderColor: '#c66',
            //   backgroundColor: '#eee',
            // }}
            // disabledStyle={{ opacity: 0.5 }}
          >
            {({ getRootProps, getInputProps }) => (
              <section className="container">
                <div
                  {...getRootProps({
                    className: 'filepicker dropzone dz-clickable',
                  })}
                >
                  <input {...getInputProps()} name="file" data-testid="drop-input" />
                  <div data-filetype=".csv" className="filepicker-file-icon" />
                  <div data-filetype=".tsv" className="filepicker-file-icon" />
                  <div data-filetype=".xls" className="filepicker-file-icon" />
                  <div data-filetype=".xlsx" className="filepicker-file-icon" />
                  <div data-filetype=".parquet" className="filepicker-file-icon" />
                  <div className="dz-default dz-message">
                    <span>{t('Drop data files here to upload, or click to select files')}</span>
                  </div>
                </div>
                <aside className="dropzone-aside">
                  {loading && <Bouncer />}
                  {error}
                </aside>
              </section>
            )}
          </Dropzone>
        </div>
      </div>
      <div className="row pt-5">
        <div className="col-auto">
          <h3>{t('Load From The Web')}</h3>
        </div>
        <div className="col text-right">
          {dataType && url && (
            <BouncerWrapper showBouncer={loadingURL}>
              <button className="btn btn-primary p-3" onClick={loadFromWeb}>
                {t('Load')}
              </button>
            </BouncerWrapper>
          )}
        </div>
      </div>
      {!enableWebUploads && (
        <div className="form-group row">
          <div className="col-md-2 p-0" />
          <div className="col-md-8 col-form-label text-left">
            <label>{DISABLED_URL_UPLOADS_MSG}</label>
            <ul>
              <li>
                {`add `}
                <code>enable_web_uploads=True</code>
                {` to your `}
                <code className="font-weight-bold">dtale.show</code>
                {` call`}
              </li>
              <li>
                {`run this code before calling `}
                <code className="font-weight-bold">dtale.show</code>
                <pre>
                  {`import dtale.global_state as global_state\n`}
                  {`global_state.set_app_settings(dict(enable_web_uploads=True))`}
                </pre>
              </li>
              <li>
                {`add `}
                <code>enable_web_uploads = True</code>
                {` to the [app] section of your dtale.ini config file`}
              </li>
            </ul>
          </div>
          <div className="col-md-2 p-0" />
        </div>
      )}
      {enableWebUploads && (
        <>
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t('Data Type')}</label>
            <div className="col-md-8 p-0">
              <ButtonToggle
                options={Object.values(DataType).map((value) => ({ value, label: value.toUpperCase() }))}
                defaultValue={dataType}
                update={setDataType}
              />
            </div>
          </div>
          <LabeledInput label="URL" value={url} setter={setUrl} />
          <LabeledInput
            label={
              <React.Fragment>
                {t('Proxy')}
                <small className="pl-3">{t('(Optional)')}</small>
              </React.Fragment>
            }
            value={proxy}
            setter={setProxy}
          />
        </>
      )}
      <div className="pb-5">
        <h3 className="d-inline">{t('Sample Datasets')}</h3>
        <small className="pl-3 d-inline">{t('(Requires access to web)')}</small>
      </div>
      <div className="form-group row pl-5 pr-5">
        <div className="col-md-12 text-center">
          <div className="row">
            {Object.values(Dataset).map((value) => {
              const buttonProps: React.HTMLAttributes<HTMLButtonElement> = {
                className: 'btn btn-light w-100 inactive pointer dataset',
                style: { padding: '0.45rem 0.3rem' },
              };
              buttonProps.className += loadingDataset === value ? ' p-4' : '';
              buttonProps.style = { ...buttonProps.style, border: 'solid 1px #a7b3b7' };
              buttonProps.onClick = () => loadDataset(value);
              buttonProps.onMouseOver = () => setDatasetDescription(t(value) ?? '');
              return (
                <div key={value} className="col-md-4 p-1">
                  <button {...buttonProps}>
                    <BouncerWrapper showBouncer={loadingDataset === value}>
                      <span>{t(DATASET_LABELS[value])}</span>
                    </BouncerWrapper>
                  </button>
                </div>
              );
            })}
          </div>
          <label className="col col-form-label row" style={{ fontSize: '85%' }}>
            {datasetDescription ?? ''}
          </label>
        </div>
      </div>
      <SheetSelector sheets={sheets} setSheets={setSheets} mergeRefresher={mergeRefresher} />
      <CSVOptions
        {...csvProps}
        close={() => {
          setCsvProps({ show: false });
          setLoading(false);
        }}
      />
    </div>
  );
};

export default withTranslation('upload')(Upload);
