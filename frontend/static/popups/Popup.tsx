import { Resizable } from 're-resizable';
import * as React from 'react';
import { default as Modal } from 'react-bootstrap/Modal';
import { GlobalHotKeys } from 'react-hotkeys';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { DataViewerPropagateState } from '../dtale/DataViewerState';
import { buildRangeState } from '../dtale/rangeSelectUtils';
import { ActionType, SetRangeStateAction } from '../redux/actions/AppActions';
import { closeChart } from '../redux/actions/charts';
import { loadDatasets } from '../redux/actions/merge';
import { AppState, RangeState } from '../redux/state/AppState';

import DraggableModalDialog from './DraggableModalDialog';
import * as popupUtils from './popupUtils';

/** re-resizable directions */
type Direction = 'top' | 'right' | 'bottom' | 'left' | 'topRight' | 'bottomRight' | 'bottomLeft' | 'topLeft';

/** Component properties for XArrayDimensions */
interface PopupProps {
  propagateState: DataViewerPropagateState;
}

const Popup: React.FC<PopupProps & WithTranslation> = ({ t, ...props }) => {
  const { chartData, dataId } = useSelector((state: AppState) => ({
    chartData: state.chartData,
    dataId: state.dataId,
  }));
  const dispatch = useDispatch();
  const mergeRefresher = async (): Promise<void> => await loadDatasets(dispatch);
  const updateRangeState = (state: RangeState): SetRangeStateAction =>
    dispatch({ type: ActionType.SET_RANGE_STATE, ...state });

  const [minHeight, setMinHeight] = React.useState<number>();
  const [minWidth, setMinWidth] = React.useState<number>();

  React.useEffect(() => {
    if (!chartData.visible) {
      setMinHeight(undefined);
      setMinWidth(undefined);
    }
  }, []);

  React.useEffect(() => {
    if (!chartData.visible) {
      setMinHeight(undefined);
      setMinWidth(undefined);
    }
  }, [chartData]);

  const { type, visible, size, backdrop } = chartData;
  const onClose = (): void => {
    updateRangeState(buildRangeState());
    dispatch(closeChart({ ...chartData, size: size || 'lg' }));
  };
  const { title, body } = popupUtils.buildBodyAndTitle({
    ...props,
    dataId: dataId ?? '1',
    chartData,
    mergeRefresher,
    t,
  });

  const onResizeStart = (
    e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>,
    dir: Direction,
    elementRef: HTMLElement,
  ): void => {
    setMinHeight(elementRef.offsetHeight);
    setMinWidth(elementRef.offsetWidth);
  };

  return (
    <Modal
      {...{
        show: visible,
        onHide: onClose,
        dialogAs: DraggableModalDialog,
        size: size || 'lg',
        backdrop: backdrop ?? 'static',
        dialogClassName: `${type}-modal`,
      }}
      className={chartData.type}
    >
      {visible && <GlobalHotKeys keyMap={{ CLOSE_MODAL: 'esc' }} handlers={{ CLOSE_MODAL: onClose }} />}
      <Resizable
        className="modal-resizable"
        defaultSize={{ width: 'auto', height: 'auto' }}
        minHeight={minHeight}
        minWidth={minWidth}
        onResizeStart={onResizeStart}
      >
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
          <i className="ico-close pointer" onClick={onClose} />
        </Modal.Header>
        {visible && body}
        <span className="resizable-handle" />
      </Resizable>
    </Modal>
  );
};

export default withTranslation(['popup', 'filter', 'menu', 'column_menu'])(Popup);
