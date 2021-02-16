import PropTypes from "prop-types";
import React from "react";
import { Provider } from "react-redux";

import { DataViewer } from "../../dtale/DataViewer";
import app from "../../reducers/dtale";
import { createStore } from "../../reducers/store";

export default class DataPreview extends React.Component {
  constructor(props) {
    super(props);
    this.store = createStore(app.store);
    this.store.dispatch({ type: "load-preview", dataId: props.dataId });
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.dataId !== this.props.dataId) {
      this.store.dispatch({ type: "load-preview", dataId: nextProps.dataId });
      return true;
    }
    return false;
  }

  render() {
    return (
      <div className={`preview ${this.store.getState().theme}-mode`} style={{ height: "inherit" }}>
        <Provider store={this.store}>
          <DataViewer />
        </Provider>
      </div>
    );
  }
}
DataPreview.displayName = "DataPreview";
DataPreview.propTypes = { dataId: PropTypes.string };
