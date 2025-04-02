import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';

import { Checkbox } from '../popups/create/LabeledCheckbox';
import { DtaleSelect } from '../popups/create/LabeledSelect';
import { AppActions } from '../redux/actions/AppActions';
import * as chartActions from '../redux/actions/charts';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectDataId, selectMaxColumnWidth, selectSettings } from '../redux/selectors';
import { BaseOption, Popups } from '../redux/state/AppState';
import * as ColumnFilterRepository from '../repository/ColumnFilterRepository';

import { ColumnDef, DataViewerData, DataViewerPropagateState } from './DataViewerState';
import * as editUtils from './edited/editUtils';
import * as gu from './gridUtils';

/** Component properties for GridCellEditor */
export interface GridCellEditorProps {
  value?: string;
  colCfg: ColumnDef;
  rowIndex: number;
  propagateState: DataViewerPropagateState;
  data: DataViewerData;
  columns: ColumnDef[];
  rowCount: number;
}

const selectResult = createSelector(
  [selectDataId, selectSettings, selectMaxColumnWidth],
  (dataId, settings, maxColumnWidth) => ({ dataId, settings, maxColumnWidth }),
);

export const GridCellEditor: React.FC<GridCellEditorProps> = ({
  colCfg,
  rowIndex,
  propagateState,
  data,
  columns,
  rowCount,
  ...props
}) => {
  const { dataId, settings, maxColumnWidth } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();
  const openChart = (chartData: Popups): PayloadAction<Popups> => dispatch(chartActions.openChart(chartData));
  const clearEdit = (): PayloadAction<void> => dispatch(AppActions.ClearEditAction());

  const [value, setValue] = React.useState(props.value ?? '');
  const [options, setOptions] = React.useState<Array<BaseOption<string>>>([]);
  const [customOptions, setCustomOptions] = React.useState<Array<BaseOption<string>>>([]);
  const input = React.useRef<HTMLInputElement>(null);

  const escapeHandler = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      clearEdit();
    }
  };

  React.useEffect(() => {
    input.current?.focus();
    window.addEventListener('keydown', escapeHandler);
    return () => window.removeEventListener('keydown', escapeHandler);
  }, []);

  React.useEffect(() => {
    const settingsOptions = (settings.column_edit_options ?? {})[colCfg.name] ?? [];
    if (settingsOptions.length) {
      setCustomOptions(settingsOptions.map((so) => ({ value: so })));
    } else {
      if (gu.ColumnType.CATEGORY === gu.findColType(colCfg.dtype)) {
        (async () => {
          const filterData = await ColumnFilterRepository.loadFilterData(dataId, colCfg.name);
          setOptions(filterData?.uniques?.map((v) => ({ value: `${v}` })) ?? []);
        })();
      }
      setCustomOptions([]);
    }
  }, [colCfg.name]);

  const onKeyDown = (e: React.KeyboardEvent): void => {
    editUtils.onKeyDown(e, colCfg, rowIndex, value, props.value, {
      dataId,
      settings,
      maxColumnWidth: maxColumnWidth ?? undefined,
      clearEdit,
      openChart,
      propagateState,
      data,
      columns,
      rowCount,
    });
  };

  if (customOptions.length) {
    return (
      <div
        onKeyDown={onKeyDown}
        tabIndex={-1}
        style={{ background: 'lightblue', width: 'inherit', height: 'inherit', padding: '0' }}
        className="editor-select"
      >
        <DtaleSelect
          value={{ value }}
          options={[{ value: 'nan' }, ...customOptions]}
          onChange={(state: BaseOption<string> | Array<BaseOption<any>> | undefined) =>
            setValue((state as BaseOption<string>)?.value ?? '')
          }
          menuPortalTarget={true}
        />
      </div>
    );
  } else if (gu.ColumnType.BOOL === gu.findColType(colCfg.dtype)) {
    return (
      <div
        onKeyDown={onKeyDown}
        tabIndex={-1}
        style={{ background: 'lightblue', width: 'inherit', height: 'inherit', padding: '0 0.65em' }}
      >
        <Checkbox
          value={'true' === value.toLowerCase()}
          setter={(checked: boolean) => setValue(checked ? 'True' : 'False')}
        />
      </div>
    );
  } else if (gu.ColumnType.CATEGORY === gu.findColType(colCfg.dtype)) {
    return (
      <div
        onKeyDown={onKeyDown}
        tabIndex={-1}
        style={{ background: 'lightblue', width: 'inherit', height: 'inherit', padding: '0' }}
        className="editor-select"
      >
        <DtaleSelect
          value={{ value }}
          options={[{ value: 'nan' }, ...options]}
          onChange={(state: BaseOption<string> | Array<BaseOption<any>> | undefined) =>
            setValue((state as BaseOption<string>)?.value ?? '')
          }
          menuPortalTarget={true}
        />
      </div>
    );
  }

  return (
    <input
      data-testid="grid-cell-editor"
      ref={input}
      style={{ background: 'lightblue', width: 'inherit' }}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={onKeyDown}
    />
  );
};
