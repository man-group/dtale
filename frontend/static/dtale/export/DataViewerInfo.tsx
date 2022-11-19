import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import * as settingsActions from '../../redux/actions/settings';
import { AppState, InstanceSettings } from '../../redux/state/AppState';
import { ColumnDef, DataViewerPropagateState } from '../DataViewerState';
import * as gu from '../gridUtils';
import { buildMenuHandler, InfoMenuType } from '../info/infoUtils';

import FilterDisplay from './FilterDisplay';

require('../info/DataViewerInfo.scss');

/** Component properties for DataViewerInfo */
export interface DataViewerInfoProps {
  columns: ColumnDef[];
  error?: JSX.Element;
  propagateState: DataViewerPropagateState;
}

const DataViewerInfo: React.FC<DataViewerInfoProps & WithTranslation> = ({ columns, error, propagateState, t }) => {
  const reduxState = useSelector((state: AppState) => ({
    predefinedFilterConfigs: state.predefinedFilters,
    invertFilter: state.settings.invertFilter ?? false,
    query: state.settings.query,
    columnFilters: state.settings.columnFilters,
    predefinedFilters: state.settings.predefinedFilters,
    outlierFilters: state.settings.outlierFilters,
    sortInfo: state.settings.sortInfo,
  }));
  const dispatch = useDispatch();
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): AnyAction =>
    dispatch(settingsActions.updateSettings(updatedSettings) as any as AnyAction);

  const [menuOpen, setMenuOpen] = React.useState<InfoMenuType>();
  const sortRef = React.useRef<HTMLDivElement>(null);
  const hideRef = React.useRef<HTMLDivElement>(null);

  const renderSort = (): React.ReactNode => {
    if (!reduxState.sortInfo?.length) {
      return null;
    }
    const label = <div className="font-weight-bold d-inline-block">{t('Sort')}:</div>;
    const clearAll = (
      <i
        className="ico-cancel pl-3 pointer"
        style={{ marginTop: '-0.1em' }}
        onClick={() => updateSettings({ sortInfo: [] })}
      />
    );
    if (reduxState.sortInfo.length === 1) {
      return (
        <React.Fragment>
          {label}
          <div className="pl-3 d-inline-block">{`${reduxState.sortInfo[0][0]} (${reduxState.sortInfo[0][1]})`}</div>
          {clearAll}
        </React.Fragment>
      );
    }
    let sortText = reduxState.sortInfo.map(([col, dir]) => `${col} (${dir})`).join(', ');
    if (sortText.length > 60) {
      sortText = `${reduxState.sortInfo.length} ${t('Sorts')}`;
    }
    const clickHandler = buildMenuHandler(InfoMenuType.SORT, setMenuOpen, sortRef);
    const dropSort =
      (dropCol: string): (() => AnyAction) =>
      (): AnyAction =>
        updateSettings({ sortInfo: reduxState.sortInfo?.filter((s) => s[0] !== dropCol) ?? [] });
    return (
      <React.Fragment>
        {label}
        <div ref={sortRef} className="pl-3 d-inline-block sort-menu-toggle" onClick={clickHandler}>
          <span className="pointer">{sortText}</span>
          <div className="column-toggle__dropdown" hidden={menuOpen !== InfoMenuType.SORT}>
            <ul>
              {reduxState.sortInfo.map(([col, dir]) => (
                <li key={`${col}-${dir}`}>
                  <span className="toggler-action">
                    <button className="btn btn-plain ignore-click" onClick={dropSort(col)}>
                      <i className="ico-cancel mr-4" />
                    </button>
                  </span>
                  <span className="font-weight-bold text-nowrap">{`${col} (${dir})`}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {clearAll}
      </React.Fragment>
    );
  };

  const renderHidden = (): React.ReactNode => {
    if (gu.noHidden(columns)) {
      return null;
    }
    const label = <div className="font-weight-bold d-inline-block">{t('Hidden')}:</div>;
    const hidden = columns.filter((c) => !c.visible).map((c) => c.name);
    const clearHidden = async (): Promise<void> => {
      propagateState({
        columns: columns.map((c) => ({ ...c, visible: true })),
        triggerResize: true,
      });
    };
    const clearAll = <i className="ico-cancel pl-3 pointer" style={{ marginTop: '-0.1em' }} onClick={clearHidden} />;
    if (hidden.length === 1) {
      return (
        <React.Fragment>
          {label}
          <div className="pl-3 d-inline-block filter-menu-toggle">{hidden.join(', ')}</div>
          {clearAll}
        </React.Fragment>
      );
    }
    const clickHandler = buildMenuHandler(InfoMenuType.HIDDEN, setMenuOpen, hideRef);
    let hiddenText = hidden.join(', ');
    if (hiddenText.length > 30) {
      hiddenText = `${hidden.length} ${t('Columns')}`;
    }
    const unhideCol =
      (colToUnhide: string): (() => Promise<void>) =>
      async (): Promise<void> => {
        const updatedColumns = columns.map((c) => ({ ...c, visible: c.name === colToUnhide ? true : c.visible }));
        propagateState({ columns: updatedColumns });
      };
    return (
      <React.Fragment>
        {label}
        <div ref={hideRef} className="pl-3 d-inline-block hidden-menu-toggle" onClick={clickHandler}>
          <span className="pointer">{hiddenText}</span>
          <div className="column-toggle__dropdown" hidden={menuOpen !== InfoMenuType.HIDDEN}>
            <ul>
              {hidden.map((col, i) => (
                <li key={i}>
                  <span className="toggler-action">
                    <button className="btn btn-plain ignore-clicks" onClick={unhideCol(col)}>
                      <i className="ico-cancel mr-4" />
                    </button>
                  </span>
                  <span className="font-weight-bold text-nowrap">{col}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {clearAll}
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      <div className={`row data-viewer-error${error ? ' is-expanded' : ''}`}>
        <div className="col-md-12">{error}</div>
      </div>
      <div className={`row text-center data-viewer-info${gu.hasNoInfo(reduxState, columns) ? '' : ' is-expanded'}`}>
        <div className="col text-left">{renderSort()}</div>
        <div className="col-auto">
          <FilterDisplay menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        </div>
        <div className="col text-right">{renderHidden()}</div>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('main')(DataViewerInfo);
