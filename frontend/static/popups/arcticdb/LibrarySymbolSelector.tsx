import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { BouncerWrapper } from '../../BouncerWrapper';
import AsyncValueSelect from '../../filters/AsyncValueSelect';
import { useAppSelector } from '../../redux/hooks';
import { selectDataId } from '../../redux/selectors';
import { BaseOption } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as ArcticDBRepository from '../../repository/ArcticDBRepository';
import { LabeledSelect } from '../create/LabeledSelect';
import { jumpToDataset } from '../upload/uploadUtils';

const LibrarySymbolSelector: React.FC<WithTranslation> = ({ t }) => {
  const dataId = useAppSelector(selectDataId);
  const currentSymbol = React.useMemo(() => {
    const dataIdSegs = decodeURIComponent(decodeURIComponent(dataId)).split('|');
    return dataIdSegs[dataIdSegs.length - 1];
  }, [dataId]);

  const [library, setLibrary] = React.useState<BaseOption<string>>();
  const [libraries, setLibraries] = React.useState<ArcticDBRepository.LibrariesResponse>();
  const [loadingLibraries, setLoadingLibraries] = React.useState(true);
  const [symbol, setSymbol] = React.useState<BaseOption<string>>();
  const [symbols, setSymbols] = React.useState<ArcticDBRepository.SymbolsResponse>();
  const [loadingSymbols, setLoadingSymbols] = React.useState(false);
  const [loadingSymbol, setLoadingSymbol] = React.useState(false);
  const [error, setError] = React.useState<JSX.Element>();
  const [loadingDescription, setLoadingDescription] = React.useState(false);
  const [description, setDescription] = React.useState<ArcticDBRepository.LoadDescriptionResponse>();

  const loadLibraries = async (refresh?: boolean): Promise<void> => {
    const response = await ArcticDBRepository.libraries(refresh);
    setDescription(undefined);
    setLoadingLibraries(false);
    if (response?.error) {
      setError(<RemovableError {...response} />);
      return;
    }
    if (response) {
      setError(undefined);
      setLibraries(response);
      if (response.library) {
        setLibrary({ value: response.library });
      }
    }
  };

  const loadSymbols = async (libraryName: string, refresh?: boolean): Promise<void> => {
    setLoadingSymbols(true);
    setDescription(undefined);
    const response = await ArcticDBRepository.symbols(libraryName, refresh);
    setLoadingSymbols(false);
    if (response?.error) {
      setError(<RemovableError {...response} />);
      return;
    }
    if (response) {
      setError(undefined);
      setSymbols(response);
      if (response.async && response.symbols.includes(currentSymbol)) {
        setSymbol({ value: currentSymbol });
      } else {
        setSymbol(undefined);
      }
    }
  };

  React.useEffect(() => {
    loadLibraries();
  }, []);

  React.useEffect(() => {
    if (library) {
      loadSymbols(library.value);
    } else {
      setSymbols(undefined);
    }
  }, [library]);

  React.useEffect(() => setDescription(undefined), [symbol]);

  const load = async (): Promise<void> => {
    if (!library || !symbol) {
      return;
    }
    setLoadingSymbol(true);
    const response = await ArcticDBRepository.loadSymbol(library.value, symbol.value);
    setLoadingSymbol(false);
    if (response?.error) {
      setError(<RemovableError {...response} />);
      return;
    }
    if (response?.data_id) {
      jumpToDataset(encodeURIComponent(encodeURIComponent(response.data_id)));
    }
  };

  const loadDescription = async (): Promise<void> => {
    if (!library || !symbol) {
      return;
    }
    setLoadingDescription(true);
    setDescription(undefined);
    const response = await ArcticDBRepository.loadDescription(library.value, symbol.value);
    setLoadingDescription(false);
    if (response?.error) {
      setError(<RemovableError {...response} />);
      return;
    }
    setDescription(response);
  };

  return (
    <React.Fragment>
      <div className="modal-body arcticdb-body" data-testid="arcticdb">
        {error && (
          <div className="row">
            <div className="col-sm-12">{error}</div>
          </div>
        )}
        <BouncerWrapper showBouncer={loadingLibraries}>
          {!libraries?.async && (
            <LabeledSelect
              label={t('Library')}
              options={(libraries?.libraries ?? []).map((l) => ({ value: l }))}
              value={library}
              onChange={(selected) => setLibrary(selected as BaseOption<string>)}
            >
              <div className="col-md-1 pl-0 mt-3">
                <i className="ico-refresh" onClick={() => loadLibraries(true)} />
              </div>
            </LabeledSelect>
          )}
          {!!libraries?.async && (
            <div className="form-group row">
              <label className={`col-md-3 col-form-label text-right`}>{t('Library')}</label>
              <div className="col-md-8">
                <AsyncValueSelect<string>
                  {...{
                    dataId,
                    selected: library?.value,
                    selectedCol: '',
                    uniques: libraries.libraries,
                    missing: false,
                  }}
                  isMulti={false}
                  loader={(input: string): Promise<Array<{ label: string; value: string }>> =>
                    ArcticDBRepository.asyncLibraries(input).then((response) => response!)
                  }
                  updateState={async (option?: string[] | string) => {
                    setLibrary(option ? { value: option as string } : undefined);
                  }}
                />
              </div>
              <div className="col-md-1 pl-0 mt-3">
                <i className="ico-refresh" onClick={() => loadLibraries(true)} />
              </div>
            </div>
          )}
          <BouncerWrapper showBouncer={loadingSymbols}>
            {!symbols?.async && (
              <LabeledSelect
                label={t('Symbol')}
                options={(symbols?.symbols ?? []).map((s) => ({ value: s }))}
                value={symbol}
                onChange={(selected) => setSymbol(selected as BaseOption<string>)}
              >
                <div className="col-md-1 pl-0 mt-3">
                  <i className="ico-refresh" onClick={() => loadSymbols(library!.value, true)} />
                </div>
              </LabeledSelect>
            )}
            {!!symbols?.async && (
              <div className="form-group row">
                <label className={`col-md-3 col-form-label text-right`}>{t('Symbol')}</label>
                <div className="col-md-8">
                  <AsyncValueSelect<string>
                    {...{ dataId, selected: symbol?.value, selectedCol: '', uniques: symbols.symbols, missing: false }}
                    isMulti={false}
                    loader={(input: string): Promise<Array<{ label: string; value: string }>> =>
                      ArcticDBRepository.asyncSymbols(library!.value, input).then((response) => response!)
                    }
                    updateState={async (option?: string[] | string) => {
                      setSymbol(option ? { value: option as string } : undefined);
                    }}
                  />
                </div>
                <div className="col-md-1 pl-0 mt-3">
                  <i className="ico-refresh" onClick={() => loadSymbols(library!.value, true)} />
                </div>
              </div>
            )}
          </BouncerWrapper>
          <BouncerWrapper showBouncer={loadingDescription}>
            {!!description && (
              <div className="row">
                <div className="col">
                  <b>{`${description?.library} - ${description?.symbol}`}</b>
                  <pre style={{ maxHeight: 600, overflowY: 'auto' }}>{description?.description ?? ''}</pre>
                </div>
              </div>
            )}
          </BouncerWrapper>
        </BouncerWrapper>
      </div>
      <div className="modal-footer">
        <button
          className="btn btn-secondary"
          disabled={!library || !symbol || loadingSymbol}
          onClick={loadingDescription ? () => undefined : loadDescription}
        >
          <BouncerWrapper showBouncer={loadingDescription}>
            <span>{t('View Info')}</span>
          </BouncerWrapper>
        </button>
        <button
          className="btn btn-primary"
          onClick={loadingSymbol ? () => undefined : load}
          disabled={!library || !symbol || loadingDescription}
        >
          <BouncerWrapper showBouncer={loadingSymbol}>
            <span>{t('Load')}</span>
          </BouncerWrapper>
        </button>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('arcticdb')(LibrarySymbolSelector);
