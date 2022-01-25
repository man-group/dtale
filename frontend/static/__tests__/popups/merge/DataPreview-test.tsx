import axios from 'axios';
import { mount } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { DataPreview } from '../../../popups/merge/DataPreview';
import DimensionsHelper from '../../DimensionsHelper';
import { clickColMenuSubButton, openColMenu } from '../../iframe/iframe-utils';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';

describe('DataPreview', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
  });

  beforeEach(() => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => dimensions.afterAll());

  it('loads properly', async () => {
    buildInnerHTML({ settings: '' });
    let result = mount(<DataPreview dataId="1" />, {
      attachTo: document.getElementById('content') ?? undefined,
    });
    await act(async () => await tickUpdate(result));
    result = result.update();
    await openColMenu(result, 3);
    clickColMenuSubButton(result, 'Asc');
    expect(result.find(Provider).props().store.getState().settings.sortInfo).toEqual([['col4', 'ASC']]);
  });
});
