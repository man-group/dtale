import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { BouncerWrapper } from '../../BouncerWrapper';
import { DataViewer } from '../../dtale/DataViewer';
import { MergeActions } from '../../redux/actions/MergeActions';
import { reducers as appReducers, AppStoreState } from '../../redux/reducers/app';
import { createAppStore } from '../../redux/store';

/** Component properties for DataPreview */
interface DataPreviewProps {
  dataId: string;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ dataId }) => {
  const [loading, setLoading] = React.useState(true);
  const store = React.useRef<Store>(createAppStore<AppStoreState>(appReducers));

  React.useEffect(() => {
    store.current.dispatch(MergeActions.LoadPreviewAction(dataId));
    setLoading(true);
  }, [dataId]);

  React.useEffect(() => {
    if (loading) {
      setLoading(false);
    }
  }, [loading]);

  return (
    <div className={`preview ${store.current.getState().theme}-mode`} style={{ height: 'inherit' }}>
      <Provider store={store.current}>
        <BouncerWrapper showBouncer={!dataId || loading}>
          <DataViewer />
        </BouncerWrapper>
      </Provider>
    </div>
  );
};
