import * as React from 'react';
import ModalDialog, { ModalDialogProps } from 'react-bootstrap/ModalDialog';
import Draggable from 'react-draggable';

const DraggableModalDialog: React.FC<ModalDialogProps> = (props) => (
  <Draggable handle=".modal-title">
    <ModalDialog {...props} />
  </Draggable>
);

export default DraggableModalDialog;
