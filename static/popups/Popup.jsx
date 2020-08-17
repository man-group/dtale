import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { Modal, ModalClose, ModalHeader, ModalTitle } from "react-modal-bootstrap";
import { connect } from "react-redux";

import ConditionalRender from "../ConditionalRender";
import { closeChart } from "../actions/charts";
import * as popupUtils from "./popupUtils";

class ReactPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = { title: "" };
  }

  shouldComponentUpdate(newProps) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }
    // Otherwise, use the default react behaviour.
    return false;
  }

  render() {
    const { chartData } = this.props;
    const { type, visible, size, backdrop } = chartData;
    const onClose = () => this.props.onClose({ size: size || "modal-lg" });
    const { title, body } = popupUtils.buildBodyAndTitle(this.props);
    return (
      <Modal
        {...{
          isOpen: visible,
          onRequestHide: onClose,
          size: size || "modal-lg",
          backdrop: backdrop || false,
          className: `${type}-modal`,
        }}>
        {visible && <GlobalHotKeys keyMap={{ CLOSE_MODAL: "esc" }} handlers={{ CLOSE_MODAL: onClose }} />}
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalClose onClick={onClose} />
        </ModalHeader>
        <ConditionalRender display={visible}>{body}</ConditionalRender>
      </Modal>
    );
  }
}
ReactPopup.displayName = "Popup";
ReactPopup.propTypes = {
  onClose: PropTypes.func,
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    type: PropTypes.string,
    title: PropTypes.string,
    size: PropTypes.string,
    backdrop: PropTypes.bool,
    selectedCol: PropTypes.string,
    rowIndex: PropTypes.number,
  }),
  propagateState: PropTypes.func,
};

const ReduxPopup = connect(
  state => _.pick(state, ["dataId", "iframe", "chartData"]),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(ReactPopup);

export { ReactPopup, ReduxPopup as Popup };
