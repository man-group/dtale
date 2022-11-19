import { Resizable } from 're-resizable';
import * as React from 'react';
import { default as Modal } from 'react-bootstrap/Modal';
import { withTranslation, WithTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { LabeledCheckbox } from '../create/LabeledCheckbox';
import DraggableModalDialog from '../DraggableModalDialog';

import { CSVProps, SeparatorType } from './UploadState';

const SEP_LABELS: { [k in SeparatorType]: string } = {
  [SeparatorType.COMMA]: 'Comma (,)',
  [SeparatorType.TAB]: 'Tab (\\n)',
  [SeparatorType.COLON]: 'Colon (:)',
  [SeparatorType.PIPE]: 'Pipe (|)',
  [SeparatorType.CUSTOM]: 'Custom',
};

/** Component properties for CSVOptions */
interface CSVOptionsProps extends CSVProps {
  close: () => void;
}

const CSVOptions: React.FC<CSVOptionsProps & WithTranslation> = ({ show, loader, close, t }) => {
  const [header, setHeader] = React.useState(true);
  const [separatorType, setSeparatorType] = React.useState(SeparatorType.COMMA);
  const [separator, setSeparator] = React.useState('');
  const [minHeight, setMinHeight] = React.useState<number>();
  const [minWidth, setMinWidth] = React.useState<number>();

  return (
    <Modal show={show} dialogAs={DraggableModalDialog}>
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
          <Modal.Title>{t('CSV Options')}</Modal.Title>
        </Modal.Header>
        <div key="body" className="modal-body">
          <div style={{ maxHeight: 300, overflowY: 'auto' }} className="col-md-12" data-testid="csv-options">
            <LabeledCheckbox label={`${t('Header')}?`} value={header} setter={setHeader} />
            <div className="form-group row">
              <label className="col-md-3 col-form-label text-right">{t('Separator')}</label>
              <div className="col-md-8 p-0 mb-auto mt-auto">
                <ButtonToggle
                  options={Object.values(SeparatorType).map((value) => ({ label: SEP_LABELS[value], value }))}
                  update={setSeparatorType}
                  defaultValue={separatorType}
                />
              </div>
            </div>
            {separatorType === SeparatorType.CUSTOM && (
              <div className="form-group row">
                <label className="col-md-3"> </label>
                <input
                  type="text"
                  className="form-control col-md-2 ml-5 p-2"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
        <Modal.Footer>
          <button className="btn btn-secondary" data-testid="csv-options-cancel" onClick={close}>
            <span>{t('Cancel')}</span>
          </button>
          <button
            className="btn btn-primary"
            data-testid="csv-options-load"
            onClick={() => loader?.({ header, separatorType, separator })}
          >
            <span>{t('Load')}</span>
          </button>
        </Modal.Footer>
        <span className="resizable-handle" />
      </Resizable>
    </Modal>
  );
};

export default withTranslation('upload')(CSVOptions);
