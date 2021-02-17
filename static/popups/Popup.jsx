import _ from "lodash";
import PropTypes from "prop-types";
import { Resizable } from "re-resizable";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { GlobalHotKeys } from "react-hotkeys";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import ConditionalRender from "../ConditionalRender";
import { closeChart } from "../actions/charts";
import mergeActions from "../actions/merge";
import { buildRangeState } from "../dtale/rangeSelectUtils";
import DraggableModalDialog from "./DraggableModalDialog";
import * as popupUtils from "./popupUtils";

class ReactPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = { minHeight: null, minWidth: null };
  }

  componentDidUpdate() {
    if (!_.get(this.props, "chartData.visible")) {
      this.setState({ minHeight: null, minWidth: null });
    }
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }

    if (!_.isEqual(this.state, newState)) {
      return true;
    }

    // Otherwise, use the default react behaviour.
    return false;
  }

  render() {
    const { chartData } = this.props;
    const { type, visible, size, backdrop } = chartData;
    const onClose = () =>
      this.props.propagateState(buildRangeState(), () => this.props.onClose({ size: size || "lg" }));
    const { title, body } = popupUtils.buildBodyAndTitle(this.props);

    const onResizeStart = (_e, _dir, refToElement) => {
      this.setState({
        minHeight: refToElement.offsetHeight,
        minWidth: refToElement.offsetWidth,
      });
    };
    return (
      <Modal
        {...{
          show: visible,
          onHide: onClose,
          dialogAs: DraggableModalDialog,
          size: size || "lg",
          backdrop: backdrop ?? "static",
          dialogClassName: `${type}-modal`,
        }}>
        {visible && <GlobalHotKeys keyMap={{ CLOSE_MODAL: "esc" }} handlers={{ CLOSE_MODAL: onClose }} />}
        <Resizable
          className="modal-resizable"
          defaultSize={{ width: "auto", height: "auto" }}
          minHeight={this.state.minHeight}
          minWidth={this.state.minWidth}
          onResizeStart={onResizeStart}>
          <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
          <ConditionalRender display={visible}>{body}</ConditionalRender>
          <span className="resizable-handle" />
        </Resizable>
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
  mergeRefresher: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactPopup = withTranslation(["popup", "filter", "menu", "column_menu"])(ReactPopup);
const ReduxPopup = connect(
  state => _.pick(state, ["dataId", "iframe", "chartData"]),
  dispatch => ({
    onClose: chartData => dispatch(closeChart(chartData || {})),
    mergeRefresher: () => dispatch(mergeActions.loadDatasets()),
  })
)(TranslateReactPopup);

export { TranslateReactPopup as ReactPopup, ReduxPopup as Popup };
