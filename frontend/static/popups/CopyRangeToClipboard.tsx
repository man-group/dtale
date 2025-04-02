import { PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';

import { AppActions } from '../redux/actions/AppActions';
import { closeChart } from '../redux/actions/charts';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectChartData } from '../redux/selectors';
import { CopyRangeToClipboardPopupData } from '../redux/state/AppState';

require('./Confirmation.css');

export const CopyRangeToClipboard: React.FC = () => {
  const chartData = useAppSelector(selectChartData) as CopyRangeToClipboardPopupData;
  const dispatch = useAppDispatch();
  const [includeHeaders, setIncludeHeaders] = React.useState<boolean>(false);
  const [finalText, setFinalText] = React.useState<string>(chartData.text);
  const textArea = React.useRef<HTMLTextAreaElement>(null);

  const outerOnClose = (): PayloadAction<void> => dispatch(closeChart());

  React.useEffect(() => {
    const { text, headers } = chartData;
    setFinalText(includeHeaders ? `${headers.join('\t')}\n${text}` : text);
  }, [includeHeaders]);

  const onClose = (): void => {
    dispatch(
      AppActions.SetRangeStateAction({
        rowRange: null,
        columnRange: null,
        rangeSelect: null,
        ctrlRows: null,
        ctrlCols: null,
        selectedRow: null,
      }),
    );
    outerOnClose();
  };

  const copy = (): void => {
    if (textArea.current) {
      textArea.current.value = finalText;
      textArea.current.select();
      document.execCommand('copy');
      onClose();
    }
  };

  return (
    <React.Fragment>
      <div className="modal-body" id="copy-range-to-clipboard">
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">Include Headers?</label>
          <div className="col-auto mt-auto mb-auto font-weight-bold p-0">
            <i
              className={`ico-check-box${includeHeaders ? '' : '-outline-blank'} pointer`}
              onClick={() => setIncludeHeaders(!includeHeaders)}
            />
          </div>
        </div>
        <div className="form-group row">
          <div className="col-md-12">
            <pre className="mb-0" style={{ maxHeight: 200 }}>
              {finalText.length > 500 ? `${finalText.substring(0, 500)}...` : finalText}
            </pre>
          </div>
        </div>
      </div>
      <div className="modal-footer confirmation">
        <button className="btn btn-primary" onClick={copy}>
          <span>Yes</span>
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          <span>No</span>
        </button>
      </div>
      <textarea
        ref={textArea}
        style={{ position: 'absolute', left: -1 * window.innerWidth }}
        onChange={() => undefined}
      />
    </React.Fragment>
  );
};
