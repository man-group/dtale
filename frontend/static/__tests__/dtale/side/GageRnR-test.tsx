import { act, render, RenderResult, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import GageRnR from '../../../dtale/side/GageRnR';
import * as DtypesRepository from '../../../repository/DtypesRepository';
import * as GageRnRRepository from '../../../repository/GageRnRRepository';
import reduxUtils from '../../redux-test-utils';
import { selectOption } from '../../test-utils';

const GageData = require('./gage_rnr.json');

describe('Gage R&R', () => {
  let wrapper: RenderResult;
  const mockStore = configureStore();
  let store: Store;

  const buildMock = async (): Promise<void> => {
    wrapper = await act(async (): Promise<RenderResult> => {
      return render(
        <Provider store={store}>
          <GageRnR />
        </Provider>,
      );
    });
  };

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    store = mockStore({ dataId: '1', settings: {} });
    const runSpy = jest.spyOn(GageRnRRepository, 'run');
    runSpy.mockResolvedValue({ ...GageData });
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully', async () => {
    await buildMock();
    expect(wrapper.container.getElementsByClassName('Select')).toHaveLength(2);
    await selectOption(wrapper.container.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    expect(wrapper.container.getElementsByClassName('gage-report')[0].getAttribute('aria-rowcount')).toBe('6');
  });

  it('handles dtype loading error gracefully', async () => {
    const loadDtypesSpy = jest.spyOn(DtypesRepository, 'loadDtypes');
    loadDtypesSpy.mockResolvedValue({ error: 'dtype error', success: false, dtypes: [] });
    await buildMock();
    expect(screen.getByRole('alert')).toBeDefined();
    loadDtypesSpy.mockRestore();
  });
});
