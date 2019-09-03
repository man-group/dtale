import PropTypes from "prop-types";
import React from "react";
import { Modal, ModalBody, ModalClose, ModalFooter, ModalHeader, ModalTitle } from "react-modal-bootstrap";

import { RemovableError } from "../RemovableError";
import { buildURLString } from "../actions/url-utils";
import { fetchJson } from "../fetcher";

class Filter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { query: "", error: null };
    this.save = this.save.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible && !prevProps.visible) {
      this.setState({ query: this.props.query });
    }
  }

  save() {
    const { query } = this.state;
    fetchJson(buildURLString("/dtale/test-filter", { query }), data => {
      if (data.error) {
        this.setState({ error: data.error, traceback: data.traceback });
        return;
      }
      this.setState({ error: null, traceback: null }, () =>
        this.props.propagateState({ query: this.state.query, filterOpen: false })
      );
    });
  }

  render() {
    if (!this.props.visible) {
      return null;
    }
    const hide = () => this.props.propagateState({ filterOpen: false });
    return (
      <Modal isOpen={this.props.visible} onRequestHide={hide} size="modal-lg" backdrop={false}>
        <ModalHeader>
          <ModalTitle>
            <i className="fa fa-filter" />
            Filter
          </ModalTitle>
          <ModalClose onClick={hide} />
        </ModalHeader>
        <ModalBody>
          <RemovableError {...this.state} onRemove={() => this.setState({ error: null, traceback: null })} />
          <textarea
            style={{ width: "100%" }}
            value={this.state.query || ""}
            onChange={event => this.setState({ query: event.target.value })}
          />
        </ModalBody>
        <ModalFooter>
          <button
            className="btn btn-secondary"
            onClick={e => {
              e.preventDefault();
              window.open(
                "https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#indexing-query",
                null,
                "titlebar=1,location=1,status=1,width=990,height=450"
              );
            }}>
            <span>Help</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => this.props.propagateState({ query: "", filterOpen: false })}>
            <span>Clear</span>
          </button>
          <button className="btn btn-primary" onClick={this.save}>
            <span>Apply</span>
          </button>
        </ModalFooter>
      </Modal>
    );
  }
}
Filter.displayName = "Filter";
Filter.propTypes = {
  query: PropTypes.string,
  visible: PropTypes.bool,
  propagateState: PropTypes.func,
};

export default Filter;
