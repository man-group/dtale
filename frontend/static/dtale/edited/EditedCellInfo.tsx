import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { ActionType, AppActions, ClearEditAction, EditedTextAreaHeightAction } from '../../redux/actions/AppActions';
import * as chartActions from '../../redux/actions/charts';
import { AppState, Popups } from '../../redux/state/AppState';
import { getCell } from '../gridUtils';

import { onKeyDown as baseKeyDown, EditedCellInfoProps } from './editUtils';

require('./EditedCellInfo.scss');

const EditedCellInfo: React.FC<EditedCellInfoProps & WithTranslation> = ({
  propagateState,
  data,
  columns,
  rowCount,
  t,
}) => {
  const { dataId, editedCell, settings, maxColumnWidth } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    editedCell: state.editedCell,
    settings: state.settings,
    maxColumnWidth: state.maxColumnWidth,
  }));
  const dispatch = useDispatch();
  const openChart = (chartData: Popups): AppActions<void> => dispatch(chartActions.openChart(chartData));
  const clearEdit = (): ClearEditAction => dispatch({ type: ActionType.CLEAR_EDIT });
  const updateHeight = (height: number): EditedTextAreaHeightAction =>
    dispatch({ type: ActionType.EDITED_CELL_TEXTAREA_HEIGHT, height });

  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const [value, setValue] = React.useState<string>();
  const [origValue, setOrigValue] = React.useState<string>();

  const cell = React.useMemo(() => {
    if (!editedCell) {
      return undefined;
    }
    return getCell(editedCell, columns, data, settings.backgroundMode);
  }, [editedCell, columns, data, settings.backgroundMode]);

  React.useEffect(() => {
    if (cell?.rec) {
      setValue(`${cell.rec.raw}`);
      setOrigValue(`${cell.rec.raw}`);
    }
  }, [cell]);

  React.useEffect(() => {
    if (inputRef.current && origValue) {
      const ref = inputRef.current;
      ref.style.height = '0px';
      ref.style.height = `${ref.scrollHeight}px`;
      ref.focus();
      updateHeight(ref.scrollHeight + 25);
    }
  }, [origValue]);

  const onKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>): Promise<void> => {
    if (cell) {
      await baseKeyDown(e, cell.colCfg, cell.rowIndex, value ?? '', origValue ?? '', {
        data,
        columns,
        rowCount,
        propagateState,
        dataId,
        settings,
        maxColumnWidth: maxColumnWidth ?? undefined,
        openChart,
        clearEdit,
      });
    }
  };

  return (
    <div className={`row edited-cell-info${editedCell ? ' is-expanded' : ''}`}>
      {cell && (
        <div className="col-md-12 pr-3 pl-3">
          <span className="font-weight-bold pr-3">Editing Cell</span>
          <span>[Column:</span>
          <span className="font-weight-bold pl-3">{cell.colCfg?.name}</span>
          <span>, Row:</span>
          <span className="font-weight-bold pl-3">{cell.rowIndex - 1}</span>
          <span>]</span>
          <small className="pl-3">(Press ENTER to submit or ESC to exit)</small>
          <textarea
            ref={inputRef}
            style={{ width: 'inherit' }}
            value={value ?? ''}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
      )}
    </div>
  );
};

export default withTranslation('main')(EditedCellInfo);
