import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import Draggable from 'react-draggable';
import * as redux from 'react-redux';
import { MultiGrid } from 'react-virtualized';

import { createMockComponent } from '../../mocks/createMockComponent'; // eslint-disable-line import/order
jest.mock('../../../dtale/side/SidePanelButtons', () => ({
  __esModule: true,
  default: createMockComponent(),
}));

import ChartsBody from '../../../popups/charts/ChartsBody';
import { Correlations } from '../../../popups/correlations/Correlations';
import CorrelationsGrid from '../../../popups/correlations/CorrelationsGrid';
import CorrelationsTsOptions from '../../../popups/correlations/CorrelationsTsOptions';
import * as CorrelationsRepository from '../../../repository/CorrelationsRepository';
import correlationsData from '../../data/correlations.json';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../../test-utils';

const chartData = {
  visible: true,
  type: 'correlations',
  title: 'Correlations Test',
  query: 'col == 3',
  col1: 'col1',
  col2: 'col3',
};

describe('Correlations tests', () => {
  let result: ReactWrapper;
  let axiosGetSpy: jest.SpyInstance;

  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
  });

  afterEach(() => axiosGetSpy.mockRestore());

  afterAll(() => {
    jest.restoreAllMocks();
    dimensions.afterAll();
  });

  const buildResult = async (overrides?: any): Promise<void> => {
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue({ dataId: '1', chartData, ...overrides });
    buildInnerHTML({ settings: '' });
    result = mount(<Correlations />, {
      attachTo: document.getElementById('content') ?? undefined,
    });
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  it('Correlations rendering data', async () => {
    await buildResult();
    await tickUpdate(result);
    expect(result.find(ChartsBody).length).toBe(1);
    expect(
      result
        .find('select.custom-select')
        .first()
        .find('option')
        .map((o) => o.text()),
    ).toEqual(['col4', 'col5']);
    await act(async () => {
      result
        .find('select.custom-select')
        .first()
        .simulate('change', { target: { value: 'col5' } });
    });
    result = result.update();
    expect(result.find(CorrelationsTsOptions).props().selectedDate).toBe('col5');
  });

  it('Correlations rendering data and filtering it', async () => {
    await buildResult();
    expect(result.find(ChartsBody).length).toBe(1);
  });

  it('Correlations rendering data w/ one date column', async () => {
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({
          data: {
            data: correlationsData.data,
            dates: [{ name: 'col4', rolling: false }],
          },
        });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    expect(result.find(ChartsBody).length).toBe(1);
    expect(result.find('select.custom-select').length).toBe(0);
    expect(result.find(CorrelationsTsOptions).props().selectedDate).toBe('col4');
  });

  it('Correlations rendering data w/ no date columns', async () => {
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({ data: { data: correlationsData.data, dates: [] } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    expect(result.find('#rawScatterChart').length).toBe(1);
  });

  const windowInput = (): ReactWrapper =>
    result
      .find(CorrelationsTsOptions)
      .find('input')
      .findWhere((i) => i.prop('type') === 'text')
      .first();

  it('Correlations rendering rolling data', async () => {
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({ data: { ...correlationsData, rolling: true } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    expect(result.find(ChartsBody).length).toBe(1);
    expect(result.find('#rawScatterChart').length).toBe(1);
    expect(
      result
        .find('select.custom-select')
        .first()
        .find('option')
        .map((o) => o.text()),
    ).toEqual(['col4', 'col5']);
    await act(async () => {
      result
        .find('select.custom-select')
        .first()
        .simulate('change', { target: { value: 'col5' } });
    });
    result = result.update();
    expect(result.find(CorrelationsTsOptions).props().selectedDate).toBe('col5');
    await act(async () => {
      windowInput().simulate('change', { target: { value: '' } });
    });
    result = result.update();
    await act(async () => {
      windowInput().simulate('keydown', { key: 'Shift' });
    });
    result = result.update();
    await act(async () => {
      windowInput().simulate('keydown', { key: 'Enter' });
    });
    result = result.update();
    await act(async () => {
      windowInput().simulate('change', { target: { value: 'a' } });
    });
    result = result.update();
    await act(async () => {
      windowInput().simulate('keydown', { key: 'Enter' });
    });
    result = result.update();
    await act(async () => {
      windowInput().simulate('change', { target: { value: '5' } });
    });
    result = result.update();
    await act(async () => {
      windowInput().simulate('keydown', { key: 'Enter' });
    });
    result = result.update();
    expect(result.find(CorrelationsGrid).props().window).toBe(5);
  });

  it('Correlations w/ col1 pre-selected', async () => {
    await buildResult({ chartData: { ...chartData, col2: undefined } });
    expect(result.find(CorrelationsTsOptions).props().selectedCols).toEqual(['col1', 'col2']);
  });

  it('Correlations w/ col2 pre-selected', async () => {
    await buildResult({ chartData: { ...chartData, col1: undefined } });
    expect(result.find(CorrelationsTsOptions).props().selectedCols).toEqual(['col1', 'col3']);
  });

  it('Correlations w/ encoded strings', async () => {
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({ data: { ...correlationsData, strings: ['col5'] } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    const loadCorrelationsSpy = jest.spyOn(CorrelationsRepository, 'loadCorrelations');
    await act(async () => {
      result.find(CorrelationsGrid).props().toggleStrings();
    });
    result = result.update();
    expect(result.find(CorrelationsGrid).props().encodeStrings).toBe(true);
    expect(loadCorrelationsSpy).toHaveBeenCalledWith('1', true);
  });

  it('Handles grid height drag', async () => {
    await buildResult();
    await act(async () => {
      result.find(CorrelationsGrid).find(Draggable).props().onDrag?.(null, { deltaY: 100 });
    });
    result = result.update();
    expect(result.find(MultiGrid).props().height).toBe(400);
  });
});
