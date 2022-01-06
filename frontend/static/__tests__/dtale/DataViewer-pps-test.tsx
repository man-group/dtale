import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import CorrelationsGrid from '../../popups/correlations/CorrelationsGrid';
import PPSDetails from '../../popups/pps/PPSDetails';
import PredictivePowerScore from '../../popups/pps/PredictivePowerScore';
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
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    const props = { dataId: '1', chartData: { visible: true } };
    result = mount(
      <Provider store={store}>
        <PredictivePowerScore {...props} />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await tickUpdate(result);
    const ppsGrid = result.find(PredictivePowerScore).first().find('div.ReactVirtualized__Grid__innerScrollContainer');
    ppsGrid.find('div.cell').at(1).simulate('click');
    await tickUpdate(result);
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
    result.find(PredictivePowerScore).setState({ strings: ['foo'] });
    result.find(CorrelationsGrid).props().toggleStrings();
    await tickUpdate(result);
    expect(result.find(PredictivePowerScore).state().encodeStrings).toBe(true);
  });
});
