import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import Draggable from 'react-draggable';
import { GlobalHotKeys } from 'react-hotkeys';

import { Correlations } from '../../popups/correlations/Correlations';
import FilterPanel from '../../popups/filter/FilterPanel';
import PredictivePowerScore from '../../popups/pps/PredictivePowerScore';
import Reports from '../../popups/timeseries/Reports';
import { AppActions, SidePanelActionProps } from '../../redux/actions/AppActions';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectSidePanelView, selectSidePanelVisible } from '../../redux/selectors';
import { SidePanelType } from '../../redux/state/AppState';

import CorrelationAnalysis from './CorrelationAnalysis';
import DescribePanel from './DescribePanel';
import GageRnR from './GageRnR';
import MissingNoCharts from './MissingNoCharts';
import PredefinedFilters from './predefined_filters/Panel';
import * as panelUtils from './sidePanelUtils';

require('./SidePanel.scss');

/** Component properties for SidePanel */
interface SidePanelProps {
  gridPanel: HTMLDivElement | null;
}

const selectResult = createSelector([selectSidePanelVisible, selectSidePanelView], (visible, view) => ({
  visible,
  view,
}));

export const SidePanel: React.FC<SidePanelProps> = ({ gridPanel }) => {
  const { visible, view } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();
  const hideSidePanel = (): PayloadAction<void> => dispatch(AppActions.HideSidePanelAction());
  const updatePanelWidth = (offsetUpdate?: number): PayloadAction<SidePanelActionProps> =>
    dispatch(AppActions.UpdateSidePanelWidthAction({ offset: offsetUpdate }));
  const [offset, setOffset] = React.useState<number>();
  const panel = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setOffset(0), [view]);

  React.useEffect(() => {
    if (!visible) {
      panel.current?.style.removeProperty('width');
    }
  }, [visible]);

  const startResize = (): void => {
    gridPanel?.style.setProperty('transition', 'none', 'important');
    panel.current?.style.setProperty('transition', 'none', 'important');
  };

  const resize = (deltaX: number): void => {
    const finalOffset = Math.min((offset ?? 0) + deltaX, 0);
    const { width } = panelUtils.calcWidth(view!, finalOffset);
    if (width) {
      panel.current?.style.setProperty('width', `${width}`, 'important');
    }
    setOffset(finalOffset);
  };

  const stopResize = (): void => {
    gridPanel?.style.setProperty('transition', null);
    panel.current?.style.setProperty('transition', null);
    updatePanelWidth(offset);
  };

  return (
    <div className={`side-panel-content${visible ? ` is-expanded ${view} pl-5 pr-5 pt-3` : ''}`} ref={panel}>
      {visible && (
        <Draggable
          axis="x"
          defaultClassName="PanelDragHandle"
          defaultClassNameDragging="PanelDragHandleActive"
          onStart={startResize}
          onDrag={(_e, { deltaX }) => resize(deltaX)}
          onStop={stopResize}
          position={{ x: 0, y: 0 }}
        >
          <div className="PanelDragHandleIcon">⋮</div>
        </Draggable>
      )}
      {visible && <GlobalHotKeys keyMap={{ CLOSE_PANEL: 'esc' }} handlers={{ CLOSE_PANEL: hideSidePanel }} />}
      <DescribePanel />
      {visible && view === SidePanelType.MISSINGNO && <MissingNoCharts />}
      {visible && view === SidePanelType.CORR_ANALYSIS && <CorrelationAnalysis />}
      {visible && view === SidePanelType.CORRELATIONS && <Correlations />}
      {visible && view === SidePanelType.PPS && <PredictivePowerScore />}
      {visible && view === SidePanelType.FILTER && <FilterPanel />}
      {visible && view === SidePanelType.PREDEFINED_FILTERS && <PredefinedFilters />}
      {visible && view === SidePanelType.GAGE_RNR && <GageRnR />}
      {visible && view === SidePanelType.TIMESERIES_ANALYSIS && <Reports />}
    </div>
  );
};
