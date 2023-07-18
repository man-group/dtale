import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { DataViewerPropagateState } from '../../dtale/DataViewerState';
import * as serverState from '../../dtale/serverStateManagement';
import { CloseChartAction } from '../../redux/actions/AppActions';
import { closeChart } from '../../redux/actions/charts';
import { selectChartData, selectDataId, selectIsArcticDB } from '../../redux/selectors';
import { BaseOption, JumpToColumnPopupData } from '../../redux/state/AppState';
import { LabeledSelect } from '../create/LabeledSelect';
import { VisibilityState } from '../describe/DescribeState';

/** Component properties of JumpToColumn */
interface JumpToColumnProps {
  propagateState: DataViewerPropagateState;
}

const selectResult = createSelector(
  [selectChartData, selectDataId, selectIsArcticDB],
  (chartData, dataId, isArcticDB) => ({ dataId, chartData: chartData as JumpToColumnPopupData, isArcticDB }),
);

const JumpToColumn: React.FC<JumpToColumnProps & WithTranslation> = ({ propagateState, t }) => {
  const { dataId, chartData, isArcticDB } = useSelector(selectResult);
  const dispatch = useDispatch();
  const onClose = (): CloseChartAction => dispatch(closeChart());

  const save = async (column: string): Promise<void> => {
    const visibility = chartData.columns.reduce((res, colCfg) => {
      return { ...res, [colCfg.name]: colCfg.locked || colCfg.name === column };
    }, {} as VisibilityState);
    await serverState.updateVisibility(dataId, visibility);
    onClose();
    const updatedColumns = chartData.columns.map((c) => ({ ...c, visible: visibility[c.name] }));
    propagateState({ columns: updatedColumns, triggerResize: true, refresh: !!isArcticDB });
  };

  return (
    <div className="modal-body jump-to-column-body" data-testid="jump-to-column">
      <LabeledSelect
        label={t('Column')}
        options={chartData.columns.map((col) => ({ value: col.name }))}
        onChange={(selected) => save((selected as BaseOption<string>).value)}
      />
    </div>
  );
};

export default withTranslation('arcticdb')(JumpToColumn);
