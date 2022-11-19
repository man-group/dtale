import { act, fireEvent, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

jest.mock('../../dtale/side/SidePanelButtons', () => {
  const { createMockComponent } = require('../mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent(),
  };
});

import PredictivePowerScore from '../../popups/pps/PredictivePowerScore';
import * as CorrelationsRepository from '../../repository/CorrelationsRepository';
import correlationsData from '../data/correlations.json';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML } from '../test-utils';

describe('DataViewer tests', () => {
  let container: HTMLElement;
  const mockStore = configureStore();
  let store: Store;
  const { opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 1340,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    delete window.opener;
    window.opener = { location: { reload: jest.fn() } };
  });

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({
          data: { code: 'correlations code test', ...correlationsData, strings: ['col1', 'col2'] },
        });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    store = mockStore({
      dataId: '1',
      sidePanel: { visible: false },
      chartData: { visible: true },
    });

    buildInnerHTML({ settings: '' });
    await act(() => {
      const result = render(
        <Provider store={store}>
          <PredictivePowerScore />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      );
      container = result.container;
    });
    const ppsGridCell = container.getElementsByClassName('cell')[0];
    fireEvent.click(ppsGridCell);
  });

  afterAll(() => {
    jest.restoreAllMocks();
    dimensions.afterAll();
    window.opener = opener;
  });

  it('DataViewer: predictive power score', async () => {
    const details = container.getElementsByClassName('ppscore-descriptors')[0];
    const baselineScore = details.getElementsByTagName('li')[0];
    expect(baselineScore).toHaveTextContent('Baseline Score: 24,889,245,973.83');
  });

  it('handles encode strings', async () => {
    const loadCorrelationsSpy = jest.spyOn(CorrelationsRepository, 'loadCorrelations');
    const corrGrid = container.getElementsByClassName('correlations-grid')[0];
    const corrFilters = corrGrid.getElementsByClassName('correlations-filters')[1];
    const toggle = corrFilters.getElementsByTagName('i')[0];
    await act(() => {
      fireEvent.click(toggle);
    });
    expect(toggle).toHaveClass('ico-check-box pointer');
    expect(loadCorrelationsSpy).toHaveBeenCalledWith('1', true, true);
  });
});
