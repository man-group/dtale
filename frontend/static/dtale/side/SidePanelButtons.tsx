import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { ActionType, HideSidePanelAction } from '../../redux/actions/AppActions';
import { buildURLString } from '../../redux/actions/url-utils';
import * as selectors from '../../redux/selectors';
import { SidePanelType } from '../../redux/state/AppState';
import * as menuFuncs from '../menu/dataViewerMenuUtils';

/** Component properties for SidePanelButtons */
interface SidePanelButtonsProps {
  buttons?: React.ReactNode;
}

const selectResult = createSelector(
  [
    selectors.selectDataId,
    selectors.selectSidePanelColumn,
    selectors.selectSidePanelVisible,
    selectors.selectSidePanelView,
  ],
  (dataId, column, visible, view) => ({ dataId, column, visible, view }),
);

const SidePanelButtons: React.FC<SidePanelButtonsProps & WithTranslation> = ({ buttons, t }) => {
  const { dataId, column, visible, view } = useSelector(selectResult);
  const dispatch = useDispatch();
  const hideSidePanel = (): HideSidePanelAction => dispatch({ type: ActionType.HIDE_SIDE_PANEL });

  if (!visible) {
    return null;
  }

  const openTab = (): void => {
    if (view) {
      hideSidePanel();
      const path = `/dtale/popup/${SidePanelType.SHOW_HIDE === view ? 'describe' : view}`;
      window.open(buildURLString(menuFuncs.fullPath(path, dataId), column ? { selectedCol: column } : {}), '_blank');
    }
  };

  return (
    <>
      {buttons}
      <div className="col-auto pr-0 mb-auto mt-auto">
        <button className="btn btn-plain" onClick={openTab}>
          <i className="ico-open-in-new pointer" />
          <span className="align-middle">{t('Open In New Tab', { ns: 'side' })}</span>
        </button>
      </div>
      <div className="col-auto pr-0 mb-auto mt-auto">
        <button className="btn btn-plain" onClick={hideSidePanel}>
          <i className="ico-close pointer" />
          <span className="align-middle">{t('side:Close')}</span>
        </button>
      </div>
    </>
  );
};

export default withTranslation(['side'])(SidePanelButtons);
