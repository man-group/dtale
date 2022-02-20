import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

jest.mock('../../dtale/side/SidePanelButtons', () => {
  const { createMockComponent } = require('../mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent(),
  };
});

import CorrelationsGrid from '../../popups/correlations/CorrelationsGrid';
import PPSDetails from '../../popups/pps/PPSDetails';
import PredictivePowerScore from '../../popups/pps/PredictivePowerScore';
import * as CorrelationsRepository from '../../repository/CorrelationsRepository';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  const { opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 1340,
  });

  let result: ReactWrapper;

  beforeAll(() => {
    dimensions.beforeAll();
    delete window.opener;
    window.opener = { location: { reload: jest.fn() } };
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue({ dataId: '1', chartData: { visible: true } });

    buildInnerHTML({ settings: '' });
    result = mount(<PredictivePowerScore />, { attachTo: document.getElementById('content') ?? undefined });
    await act(async () => await tickUpdate(result));
    result = result.update();
    const ppsGrid = result.find(PredictivePowerScore).first().find('div.ReactVirtualized__Grid__innerScrollContainer');
    await act(async () => {
      ppsGrid.find('div.cell').at(1).simulate('click');
    });
    result = result.update();
  });

  afterAll(() => {
    jest.restoreAllMocks();
    dimensions.afterAll();
    window.opener = opener;
  });

  it('DataViewer: predictive power score', async () => {
    const details = result.find(PPSDetails);
    expect(details.prop('ppsInfo')).toEqual(expect.objectContaining({ x: 'col1', y: 'col2' }));
  });

  it('handles encode strings', async () => {
    const loadCorrelationsSpy = jest.spyOn(CorrelationsRepository, 'loadCorrelations');
    await act(async () => {
      result.find(CorrelationsGrid).props().toggleStrings();
    });
    result = result.update();
    expect(result.find(CorrelationsGrid).props().encodeStrings).toBe(true);
    expect(loadCorrelationsSpy).toHaveBeenCalledWith('1', true, true);
  });
});
