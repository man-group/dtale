import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { MultiGrid } from 'react-virtualized';
import { Store } from 'redux';

import { DataViewer, ReactDataViewer } from '../../dtale/DataViewer';
import ThemeOption from '../../dtale/menu/ThemeOption';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  let result: ReactWrapper;
  let store: Store;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));

    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', theme: 'dark' }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );

    await tickUpdate(result);
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it('DataViewer: loads dark mode correct on inital render', async () => {
    expect(result.find(ReactDataViewer).props().theme).toBe('dark');
    expect(result.find(MultiGrid).props().styleBottomLeftGrid).toMatchObject({
      backgroundColor: 'inherit',
    });
  });

  it('DataViewer: toggle dark mode', async () => {
    await act(async () => {
      result.find(ThemeOption).find('button').first().simulate('click');
    });
    result = result.update();
    expect(result.find(ReactDataViewer).props().theme).toBe('light');
    expect(result.find(MultiGrid).props().styleBottomLeftGrid).toMatchObject({
      backgroundColor: '#f7f7f7',
    });
  });
});
