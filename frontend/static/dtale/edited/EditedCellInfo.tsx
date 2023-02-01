import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { Checkbox } from '../../popups/create/LabeledCheckbox';
import { DtaleSelect } from '../../popups/create/LabeledSelect';
import {
  ActionType,
  ClearEditAction,
  EditedTextAreaHeightAction,
  OpenChartAction,
} from '../../redux/actions/AppActions';
import * as chartActions from '../../redux/actions/charts';
import { AppState, BaseOption, Popups } from '../../redux/state/AppState';
import * as ColumnFilterRepository from '../../repository/ColumnFilterRepository';
import { ColumnType, findColType, getCell } from '../gridUtils';

import { onKeyDown as baseKeyDown, EditedCellInfoProps } from './editUtils';

require('./EditedCellInfo.scss');

const EditedCellInfo: React.FC<EditedCellInfoProps & WithTranslation> = ({
  propagateState,
  data,
  columns,
  rowCount,
  t,
}) => {
  const { dataId, editedCell, settings, maxColumnWidth, hideHeaderEditor } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    editedCell: state.editedCell,
    settings: state.settings,
    maxColumnWidth: state.maxColumnWidth,
    hideHeaderEditor: state.settings?.hide_header_editor ?? state.hideHeaderEditor,
  }));
  const dispatch = useDispatch();
  const openChart = (chartData: Popups): OpenChartAction => dispatch(chartActions.openChart(chartData));
  const clearEdit = (): ClearEditAction => dispatch({ type: ActionType.CLEAR_EDIT });
  const updateHeight = (height: number): EditedTextAreaHeightAction =>
    dispatch({ type: ActionType.EDITED_CELL_TEXTAREA_HEIGHT, height });

  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const [value, setValue] = React.useState<string>();
  const [origValue, setOrigValue] = React.useState<string>();
  const [options, setOptions] = React.useState<Array<BaseOption<string>>>([]);
  const [customOptions, setCustomOptions] = React.useState<Array<BaseOption<string>>>([]);

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

  React.useEffect(() => {
    if (cell?.colCfg) {
      const { name } = cell.colCfg;
      const settingsOptions = (settings.column_edit_options ?? {})[name] ?? [];
      if (settingsOptions.length) {
        setCustomOptions(settingsOptions.map((so) => ({ value: so })));
      } else if (ColumnType.CATEGORY === findColType(cell.colCfg.dtype)) {
        (async () => {
          const filterData = await ColumnFilterRepository.loadFilterData(dataId, name);
          setOptions(filterData?.uniques?.map((v) => ({ value: `${v}` })) ?? []);
        })();
      }
    }
  }, [cell?.colCfg.name]);

  const onKeyDown = async (e: React.KeyboardEvent<HTMLElement>): Promise<void> => {
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

  const colType = React.useMemo(() => findColType(cell?.colCfg.dtype), [cell?.colCfg.dtype]);
  const isBool = React.useMemo(() => ColumnType.BOOL === colType, [colType]);

  const getInput = (): React.ReactNode => {
    if (customOptions.length) {
      return (
        <div
          onKeyDown={onKeyDown}
          tabIndex={-1}
          style={{ width: 'inherit', height: 'inherit', padding: '0' }}
          className="editor-select"
        >
          <DtaleSelect
            value={{ value }}
            options={[{ value: 'nan' }, ...customOptions]}
            onChange={(state: BaseOption<string> | Array<BaseOption<any>> | undefined) =>
              setValue((state as BaseOption<string>)?.value ?? '')
            }
          />
        </div>
      );
    } else if (isBool) {
      return (
        <div onKeyDown={onKeyDown} tabIndex={-1} style={{ width: 'inherit', height: 'inherit', padding: '0 0.65em' }}>
          <Checkbox
            value={'true' === (value ?? '').toLowerCase()}
            setter={(checked: boolean) => setValue(checked ? 'True' : 'False')}
          />
        </div>
      );
    } else if (ColumnType.CATEGORY === colType) {
      return (
        <div
          onKeyDown={onKeyDown}
          tabIndex={-1}
          style={{ width: 'inherit', height: 'inherit', padding: '0' }}
          className="editor-select"
        >
          <DtaleSelect
            value={{ value }}
            options={[{ value: 'nan' }, ...options]}
            onChange={(state: BaseOption<string> | Array<BaseOption<any>> | undefined) =>
              setValue((state as BaseOption<string>)?.value ?? '')
            }
          />
        </div>
      );
    }
    return (
      <textarea
        ref={inputRef}
        style={{ width: 'inherit' }}
        value={value ?? ''}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
      />
    );
  };

  if (hideHeaderEditor) {
    return null;
  }

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
          <small className="pl-3">{`(Press ENTER to submit or ESC to exit${isBool ? ' or "n" for "nan"' : ''})`}</small>
          {getInput()}
        </div>
      )}
    </div>
  );
};

export default withTranslation('main')(EditedCellInfo);
