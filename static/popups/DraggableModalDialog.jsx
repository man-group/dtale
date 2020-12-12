import React from "react";
import ModalDialog from "react-bootstrap/ModalDialog";
import Draggable from "react-draggable";

export default class DraggableModalDialog extends React.Component {
  render() {
    return (
      <Draggable handle=".modal-title">
        <ModalDialog {...this.props} />
      </Draggable>
    );
  }
}
