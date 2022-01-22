import { Resizable } from 're-resizable';
import React from 'react';
import Modal from 'react-bootstrap/Modal';
import { GlobalHotKeys } from 'react-hotkeys';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { ColumnDef, ColumnFormat, DataViewerData, DataViewerPropagateState } from '../../dtale/DataViewerState';
import * as gu from '../../dtale/gridUtils';
import * as serverState from '../../dtale/serverStateManagement';
import { AppState, BaseOption } from '../../redux/state/AppState';
import { LabeledCheckbox } from '../create/LabeledCheckbox';
import { LabeledSelect } from '../create/LabeledSelect';
import DraggableModalDialog from '../DraggableModalDialog';

import DateFormatting from './DateFormatting';
import NumericFormatting from './NumericFormatting';
import StringFormatting from './StringFormatting';

/** Component propertiesfor Formatting */
interface FormattingProps {
  data: DataViewerData;
  columnFormats: Record<string, ColumnFormat>;
  columns: ColumnDef[];
  selectedCol: string;
  nanDisplay?: string;
  visible: boolean;
  propagateState: DataViewerPropagateState;
}

const Formatting: React.FC<FormattingProps & WithTranslation> = ({
  data,
  columnFormats,
  columns,
  selectedCol,
  visible,
  propagateState,
  t,
  ...props
}) => {
  const { dataId, settings, maxColumnWidth } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    settings: state.settings,
    maxColumnWidth: state.maxColumnWidth,
  }));

  const [colDtype, colType] = React.useMemo(() => {
    const dtype = gu.getDtype(selectedCol, columns);
    return [dtype, gu.findColType(dtype)];
  }, [selectedCol, columns]);

  const [nanDisplay, setNanDisplay] = React.useState<BaseOption<string>>({ value: props.nanDisplay ?? 'nan' });
  const [minHeight, setMinHeight] = React.useState<number>();
  const [minWidth, setMinWidth] = React.useState<number>();
  const [applyToAll, setApplyToAll] = React.useState(false);
  const [fmt, setFmt] = React.useState<ColumnFormat>({ ...columnFormats[selectedCol] });

  React.useEffect(() => {
    if (visible) {
      setFmt({ ...columnFormats[selectedCol] });
      setNanDisplay({ value: props.nanDisplay ?? 'nan' });
    }
  }, [visible]);

  const save = async (): Promise<void> => {
    let selectedCols = [columns.find(({ name }) => name === selectedCol)!];
    if (applyToAll) {
      selectedCols = columns.filter((col) => col.dtype === colDtype);
    }
    let updatedColumnFormats = selectedCols.reduce((ret, colCfg) => ({ ...ret, [colCfg.name]: { ...fmt } }), {});
    updatedColumnFormats = { ...columnFormats, ...updatedColumnFormats };
    const updatedData = Object.keys(data).reduce((res, rowIdx) => {
      const d = data[parseInt(rowIdx, 10)];
      const updates = selectedCols.reduce((ret, colCfg) => {
        const raw = d[colCfg.name]?.raw;
        const updatedProp = gu.buildDataProps(colCfg, raw, {
          columnFormats: { [colCfg.name]: { ...fmt } },
          settings,
        });
        return { ...ret, [colCfg.name]: updatedProp };
      }, {});
      return { ...res, [rowIdx]: { ...d, ...updates } };
    }, {});
    const updatedCols = columns.map((c) => {
      if (selectedCols.find(({ name }) => name === c.name)) {
        return {
          ...c,
          ...gu.calcColWidth(c, {
            data: updatedData,
            ...settings,
            maxColumnWidth,
          }),
        };
      }
      return c;
    });
    propagateState({
      data: updatedData,
      columnFormats: updatedColumnFormats,
      nanDisplay: nanDisplay.value,
      columns: updatedCols,
      formattingOpen: false,
      triggerResize: true,
      formattingUpdate: true,
    });
    await serverState.updateFormats(dataId, selectedCol, { ...fmt }, applyToAll, nanDisplay.value);
    if (props.nanDisplay !== nanDisplay.value) {
      propagateState({ refresh: true });
    }
  };

  const hide = (): void => propagateState({ formattingOpen: false });
  return (
    <Modal show={visible} onHide={hide} backdrop="static" dialogAs={DraggableModalDialog}>
      {visible && <GlobalHotKeys keyMap={{ CLOSE_MODAL: 'esc' }} handlers={{ CLOSE_MODAL: hide }} />}
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
        <Modal.Header closeButton={true}>
          <Modal.Title>
            <i className="ico-palette" />
            {t('formatting:Formatting')}
          </Modal.Title>
        </Modal.Header>
        <div style={{ paddingBottom: '5em' }}>
          <React.Fragment>
            {visible && (
              <React.Fragment>
                {['float', 'int'].includes(colType) && (
                  <NumericFormatting columnFormats={columnFormats} selectedCol={selectedCol} updateState={setFmt} />
                )}
                {'date' === colType && (
                  <DateFormatting columnFormats={columnFormats} selectedCol={selectedCol} updateState={setFmt} />
                )}
                {['string', 'unknown'].includes(colType) && (
                  <StringFormatting columnFormats={columnFormats} selectedCol={selectedCol} updateState={setFmt} />
                )}
              </React.Fragment>
            )}
          </React.Fragment>
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
    </Modal>
  );
};

export default withTranslation(['formatting', 'builders'])(Formatting);
