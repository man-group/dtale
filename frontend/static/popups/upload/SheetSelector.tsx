import { Resizable } from 're-resizable';
import * as React from 'react';
import { default as Modal } from 'react-bootstrap/Modal';
import { withTranslation, WithTranslation } from 'react-i18next';

import { RemovableError } from '../../RemovableError';
import * as InstanceRepository from '../../repository/InstanceRepository';
import { Checkbox } from '../create/LabeledCheckbox';
import DraggableModalDialog from '../DraggableModalDialog';

import { Sheet } from './UploadState';
import { jumpToDataset } from './uploadUtils';

/** Component properties for SheetSelector */
interface SheetSelectorProps {
  sheets?: Sheet[];
  setSheets: (sheets: Sheet[]) => void;
  mergeRefresher?: () => Promise<void>;
}

const SheetSelector: React.FC<SheetSelectorProps & WithTranslation> = ({ mergeRefresher, t, ...props }) => {
  const [sheets, setSheets] = React.useState([...(props.sheets ?? [])]);
  const [error, setError] = React.useState<JSX.Element>();
  const [minHeight, setMinHeight] = React.useState<number>();
  const [minWidth, setMinWidth] = React.useState<number>();

  React.useEffect(() => setSheets([...(props.sheets ?? [])]), [props.sheets]);

  const updateSelected = (dataId: number): void =>
    setSheets(sheets.map((s) => (s.dataId === dataId ? { ...s, selected: !s.selected } : { ...s })));

  const clearSheets = (): void => {
    InstanceRepository.cleanupInstances(sheets.map(({ dataId }) => `${dataId}`)).then(() => {
      setSheets([]);
      props.setSheets([]);
    });
  };

  const loadSheets = async (): Promise<void> => {
    const sheetsToDelete = sheets.filter(({ selected }) => !selected).map(({ dataId }) => `${dataId}`);
    const dataId = `${sheets.find(({ selected }) => selected)?.dataId!}`;
    if (!sheetsToDelete.length) {
      await jumpToDataset(dataId, mergeRefresher);
      return;
    }
    const response = await InstanceRepository.cleanupInstances(sheetsToDelete);
    if (response?.error) {
      setError(<RemovableError {...response} />);
      return;
    } else if (response?.success) {
      await jumpToDataset(dataId, mergeRefresher);
    }
  };

  return (
    <Modal show={!!sheets.length} dialogAs={DraggableModalDialog}>
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
          <Modal.Title>{t('Sheet Selection')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error}
          <div style={{ maxHeight: 300, overflowY: 'auto' }} className="col-md-4" data-testid="sheet-selector">
            <ul>
              {sheets.map((sheet, i) => (
                <li key={i}>
                  <Checkbox value={sheet.selected} setter={() => updateSelected(sheet.dataId)} className="pb-2 pr-3" />
                  <b>{sheet.name}</b>
                </li>
              ))}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={clearSheets}>
            <span>{t('Clear Sheets')}</span>
          </button>
          <button
            className="btn btn-primary"
            disabled={sheets.find(({ selected }) => selected) === undefined}
            onClick={loadSheets}
          >
            <span>{t('Load Sheets')}</span>
          </button>
        </Modal.Footer>
        <span className="resizable-handle" />
      </Resizable>
    </Modal>
  );
};

export default withTranslation('upload')(SheetSelector);
