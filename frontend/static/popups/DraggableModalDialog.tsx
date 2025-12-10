import * as React from 'react';
import ModalDialog, { ModalDialogProps } from 'react-bootstrap/ModalDialog';
import Draggable from 'react-draggable';

const DraggableModalDialog: React.FC<ModalDialogProps & React.RefAttributes<HTMLDivElement>> = (props) => {
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <Draggable handle=".modal-title" nodeRef={popupRef as React.RefObject<HTMLElement>}>
      <ModalDialog {...props} ref={popupRef} />
    </Draggable>
  );
};

export default DraggableModalDialog;
