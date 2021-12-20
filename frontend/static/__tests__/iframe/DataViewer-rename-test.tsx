import axios from 'axios';
import { mount } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { DataViewer } from '../../dtale/DataViewer';
import { Rename } from '../../popups/Rename';
import { RemovableError } from '../../RemovableError';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../test-utils';

import { clickColMenuButton, openColMenu, validateHeaders } from './iframe-utils';

describe('DataViewer iframe tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  it('DataViewer: renaming a column', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', iframe: 'True' }, store as any);
    let result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );

    await tickUpdate(result);
    await openColMenu(result, 3);
    await clickColMenuButton(result, 'Rename');
    await act(async () => {
      result
        .find(Rename)
        .find('div.modal-body')
        .find('input')
        .first()
        .simulate('change', { target: { value: 'col2' } });
    });
    result = result.update();
    expect(result.find(Rename).find(RemovableError).length).toBeGreaterThan(0);
    await act(async () => {
      result
        .find(Rename)
        .find('div.modal-body')
        .find('input')
        .first()
        .simulate('change', { target: { value: 'col5' } });
    });
    result = result.update();
    await act(async () => {
      result.find(Rename).find('div.modal-footer').find('button').first().simulate('click');
    });
    // await tickUpdate(result);
    result = result.update();
    validateHeaders(result, ['col1', 'col2', 'col3', 'col5']);
  });
});
