import { Resizable } from 're-resizable';
import React from 'react';
import { default as Modal } from 'react-bootstrap/Modal';
import { GlobalHotKeys } from 'react-hotkeys';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import { ColumnDef, ColumnFormat, DataViewerData, DataViewerPropagateState } from '../../dtale/DataViewerState';
import { buildDataProps, calcColWidth, ColumnType, findColType, getDtype } from '../../dtale/gridUtils';
import * as serverState from '../../dtale/serverStateManagement';
import { ActionType, CloseFormattingAction } from '../../redux/actions/AppActions';
import * as settingsActions from '../../redux/actions/settings';
import { AppState, BaseOption, InstanceSettings } from '../../redux/state/AppState';
import { LabeledCheckbox } from '../create/LabeledCheckbox';
import { LabeledSelect } from '../create/LabeledSelect';
import DraggableModalDialog from '../DraggableModalDialog';

import DateFormatting from './DateFormatting';
import NumericFormatting from './NumericFormatting';
import StringFormatting from './StringFormatting';

/** Component propertiesfor Formatting */
interface FormattingProps {
  data: DataViewerData;
  columns: ColumnDef[];
  rowCount: number;
  propagateState: DataViewerPropagateState;
}

const Formatting: React.FC<FormattingProps & WithTranslation> = ({ data, columns, rowCount, propagateState, t }) => {
  const { dataId, settings, maxColumnWidth, formattingOpen } = useSelector((state: AppState) => state);
  const visible = formattingOpen !== null;
  const columnFormats = settings.columnFormats ?? {};
  const dispatch = useDispatch();
  const hide = (): CloseFormattingAction => dispatch({ type: ActionType.CLOSE_FORMATTING });
  const updateSettings = (updatedSettings: Partial<InstanceSettings>, callback: () => void): AnyAction =>
    dispatch(settingsActions.updateSettings(updatedSettings, callback) as any as AnyAction);

  const [colDtype, colType] = React.useMemo(() => {
    const dtype = getDtype(formattingOpen ?? undefined, columns);
    return [dtype, findColType(dtype)];
  }, [formattingOpen, columns]);

  const [nanDisplay, setNanDisplay] = React.useState<BaseOption<string>>({ value: settings.nanDisplay ?? 'nan' });
  const [minHeight, setMinHeight] = React.useState<number>();
  const [minWidth, setMinWidth] = React.useState<number>();
  const [applyToAll, setApplyToAll] = React.useState(false);
  const [fmt, setFmt] = React.useState<ColumnFormat>({ ...columnFormats[formattingOpen ?? ''] });

  React.useEffect(() => {
    if (formattingOpen) {
      setFmt({ ...columnFormats[formattingOpen] });
      setNanDisplay({ value: settings.nanDisplay ?? 'nan' });
    }
  }, [formattingOpen]);

  const save = async (): Promise<void> => {
    let selectedCols = [columns.find(({ name }) => name === formattingOpen)!];
    if (applyToAll) {
      selectedCols = columns.filter((col) => col.dtype === colDtype);
    }
    let updatedColumnFormats = selectedCols.reduce((ret, colCfg) => ({ ...ret, [colCfg.name]: { ...fmt } }), {});
    updatedColumnFormats = { ...columnFormats, ...updatedColumnFormats };
    const updatedData = Object.keys(data).reduce((res, rowIdx) => {
      const d = data[Number(rowIdx)];
      const updates = selectedCols.reduce((ret, colCfg) => {
        const raw = d[colCfg.name]?.raw;
        const updatedProp = buildDataProps(colCfg, raw, { ...settings, columnFormats: { [colCfg.name]: { ...fmt } } });
        return { ...ret, [colCfg.name]: updatedProp };
      }, {});
      return { ...res, [Number(rowIdx)]: { ...d, ...updates } };
    }, {} as DataViewerData);
    const updatedCols = columns.map((c) => {
      if (selectedCols.find(({ name }) => name === c.name)) {
        return {
          ...c,
          ...calcColWidth(
            c,
            updatedData,
            rowCount,
            settings.sortInfo,
            settings.backgroundMode,
            maxColumnWidth ?? undefined,
          ),
        };
      }
      return c;
    });
    propagateState({
      data: updatedData,
      columns: updatedCols,
      triggerResize: true,
      formattingUpdate: true,
    });
    updateSettings({ columnFormats: updatedColumnFormats, nanDisplay: nanDisplay.value }, () =>
      serverState.updateFormats(dataId, formattingOpen!, { ...fmt }, applyToAll, nanDisplay.value),
    );
    hide();
  };

  return (
    <Modal show={visible} onHide={hide} backdrop="static" dialogAs={DraggableModalDialog}>
      {visible && (
        <React.Fragment>
          <GlobalHotKeys keyMap={{ CLOSE_MODAL: 'esc' }} handlers={{ CLOSE_MODAL: hide }} />
          <Resizable
            className="modal-resizable"
            defaultSize={{ width: 'auto', height: 'auto' }}
            minHeight={minHeight}
            minWidth={minWidth}
            onResizeStart={(_e, _dir, refToElement) => {
              setMinHeight(refToElement.offsetHeight);
              setMinWidth(refToElement.offsetWidth);
            }}
          >
            <Modal.Header>
              <Modal.Title>
                <i className="ico-palette" />
                {t('formatting:Formatting')}
              </Modal.Title>
              <i className="ico-close pointer" onClick={hide} />
            </Modal.Header>
            <div className="modal-body" style={{ paddingBottom: '5em' }} data-testid="formatting-body">
              {[ColumnType.FLOAT, ColumnType.INT].includes(colType) && (
                <NumericFormatting columnFormats={columnFormats} selectedCol={formattingOpen} updateState={setFmt} />
              )}
              {ColumnType.DATE === colType && (
                <DateFormatting columnFormats={columnFormats} selectedCol={formattingOpen} updateState={setFmt} />
              )}
              {[ColumnType.STRING, ColumnType.CATEGORY, ColumnType.UNKNOWN].includes(colType) && (
                <StringFormatting columnFormats={columnFormats} selectedCol={formattingOpen} updateState={setFmt} />
              )}
              <LabeledCheckbox
                label={`${t('Apply this formatting to all columns of dtype,')} ${colDtype}?`}
                value={applyToAll}
                setter={setApplyToAll}
                rowClass="mb-5"
                labelWidth={10}
                inputWidth={1}
              />
              <LabeledSelect
                label={t(`Display "nan" values as`)}
                options={['nan', '-', ''].map((o) => ({ value: o }))}
                value={nanDisplay}
                onChange={(selected) => setNanDisplay(selected as BaseOption<string>)}
                labelWidth={4}
                inputWidth={6}
              />
            </div>
            <Modal.Footer>
              <button className="btn btn-primary" onClick={save}>
                <span>{t('builders:Apply')}</span>
              </button>
            </Modal.Footer>
            <span className="resizable-handle" />
          </Resizable>
        </React.Fragment>
      )}
    </Modal>
  );
};

export default withTranslation(['formatting', 'builders'])(Formatting);
