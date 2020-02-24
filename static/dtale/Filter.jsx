import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import { Modal, ModalBody, ModalClose, ModalFooter, ModalHeader, ModalTitle } from "react-modal-bootstrap";

import { RemovableError } from "../RemovableError";
import { buildURLString } from "../actions/url-utils";
import { fetchJson } from "../fetcher";
import ContextVariables from "./ContextVariables";

class Filter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { query: "", error: null };
    this.save = this.save.bind(this);
    this.renderBody = this.renderBody.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible && !prevProps.visible) {
      this.setState({ query: this.props.query });
    }
  }

  save() {
    const { query } = this.state;
    fetchJson(buildURLString(`/dtale/test-filter/${this.props.dataId}`, { query }), data => {
      if (data.error) {
        this.setState({ error: data.error, traceback: data.traceback });
        return;
      }
      this.setState({ error: null, traceback: null }, () =>
        this.props.propagateState({
          query: this.state.query,
          filterOpen: false,
        })
      );
    });
  }

  renderBody() {
    if (!this.props.visible) {
      return null;
    }
    return [
      <RemovableError key={0} {...this.state} onRemove={() => this.setState({ error: null, traceback: null })} />,
      <div key={1} className="row">
        <div className="col-md-7">
          <textarea
            style={{ width: "100%", height: "100%" }}
            value={this.state.query || ""}
            onChange={event => this.setState({ query: event.target.value })}
          />
        </div>
        <div className="col-md-5">
          <p className="font-weight-bold">Example queries</p>
          <ul>
            <li>
              {"drop NaN values: "}
              <span className="font-weight-bold">{"Col == Col"}</span>
            </li>
            <li>
              {"show only NaN values: "}
              <span className="font-weight-bold">{"Col != Col"}</span>
            </li>
            <li>
              {"date filtering: "}
              <span className="font-weight-bold">{`Col == '${moment().format("YYYYMMDD")}'`}</span>
            </li>
            <li>
              {"in-clause on string column: "}
              <span className="font-weight-bold">{"Col in ('foo','bar')"}</span>
            </li>
            <li>
              {"and-clause on numeric column: "}
              <span className="font-weight-bold">{"Col1 > 1 and Col2 <= 1"}</span>
            </li>
            <li>
              {"or-clause on numeric columns: "}
              <span className="font-weight-bold">{"Col1 > 1 or Col2 < 1"}</span>
            </li>
            <li>
              {"negative-clause: "}
              <span className="font-weight-bold">{"~(Col > 1)"}</span>
            </li>
            <li>
              {"parenthesis usage: "}
              <span className="font-weight-bold">{"(Col1 > 1 or Col2 < 1) and (Col3 == 3)"}</span>
            </li>
            <li>
              {"regex usage (search for substrings 'foo' or 'bar'):"}
              <br />
              <span className="font-weight-bold">{"Col.str.contains('(foo|bar)', case=False)"}</span>
            </li>
          </ul>
        </div>
      </div>,
      <div key={2} className="row">
        <ContextVariables dataId={this.props.dataId} />
      </div>,
    ];
  }

  render() {
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
        <ModalBody>{this.renderBody()}</ModalBody>
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
  dataId: PropTypes.string.isRequired,
  query: PropTypes.string,
  visible: PropTypes.bool,
  propagateState: PropTypes.func,
};

export default Filter;
