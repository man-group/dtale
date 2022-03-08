import { mount } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { MultiGrid } from 'react-virtualized';

import { ServerlessDataViewer } from '../../../dtale/export/ServerlessDataViewer';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, PREDEFINED_FILTERS, tickUpdate } from '../../test-utils';

describe('ServerlessDataViewer', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
  });

  afterAll(() => {
    dimensions.afterAll();
  });

  it('DataViewer: base operations (column selection, locking, sorting, moving to front, col-analysis,...', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', predefinedFilters: PREDEFINED_FILTERS }, store);
    const result = mount(
      <Provider store={store}>
        <ServerlessDataViewer response={reduxUtils.DATA} />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
    expect(result.find(MultiGrid).props().rowCount).toBe(6);
  });
});
