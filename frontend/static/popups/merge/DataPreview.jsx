import PropTypes from 'prop-types';
import React from 'react';
import { Provider } from 'react-redux';

import { BouncerWrapper } from '../../BouncerWrapper';
import { DataViewer } from '../../dtale/DataViewer';
import app from '../../redux/reducers/app';
import { createAppStore } from '../../redux/store';

export default class DataPreview extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: false };
    this.store = createAppStore(app);
    this.store.dispatch({ type: 'load-preview', dataId: props.dataId });
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.dataId !== this.props.dataId) {
      this.store.dispatch({ type: 'load-preview', dataId: nextProps.dataId });
      return true;
    }
    return nextState.loading !== this.state.loading;
  }

  componentDidUpdate(prevProps) {
    this.setState({ loading: prevProps.dataId !== this.props.dataId });
  }

  render() {
    return (
      <div className={`preview ${this.store.getState().theme}-mode`} style={{ height: 'inherit' }}>
        <Provider store={this.store}>
          <BouncerWrapper showBouncer={this.state.loading}>
            <DataViewer />
          </BouncerWrapper>
        </Provider>
      </div>
    );
  }
}
DataPreview.displayName = 'DataPreview';
DataPreview.propTypes = { dataId: PropTypes.string };
