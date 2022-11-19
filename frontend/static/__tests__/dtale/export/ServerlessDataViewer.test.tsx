import { act, render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { ServerlessDataViewer } from '../../../dtale/export/ServerlessDataViewer';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, PREDEFINED_FILTERS } from '../../test-utils';

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
    const result = await act(
      async () =>
        render(
          <Provider store={store}>
            <ServerlessDataViewer response={reduxUtils.DATA} />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
    expect(result.getElementsByClassName('rows')[0].textContent).toBe('5');
    expect(result.getElementsByClassName('cols')[0].textContent).toBe('4');
  });
});
