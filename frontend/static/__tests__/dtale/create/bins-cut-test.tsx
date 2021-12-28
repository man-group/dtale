import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { default as Select } from 'react-select';

import { DataViewer } from '../../../dtale/DataViewer';
import { ColumnAnalysisChart } from '../../../popups/analysis/ColumnAnalysisChart';
import { ReactBinsTester as BinsTester } from '../../../popups/create/BinsTester';
import { default as CreateBins, validateBinsCfg } from '../../../popups/create/CreateBins';
import { ReactCreateColumn as CreateColumn } from '../../../popups/create/CreateColumn';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, mockChartJS, mockT as t, tick, tickUpdate } from '../../test-utils';

import { clickBuilder } from './create-test-utils';

describe('DataViewer tests', () => {
  let result: ReactWrapper;

  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store as any);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );

    await tick();
    await clickMainMenuButton(result, 'Dataframe Functions');
    await tickUpdate(result);
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => dimensions.afterAll());

  it('DataViewer: build bins cut column', async () => {
    clickBuilder(result, 'Bins');
    expect(result.find(CreateBins).length).toBe(1);
    const binInputs = result.find(CreateBins).first();
    binInputs.find(Select).first().props().onChange({ value: 'col2' });
    binInputs.find('div.form-group').at(1).find('button').first().simulate('click');
    binInputs
      .find('div.form-group')
      .at(2)
      .find('input')
      .simulate('change', { target: { value: '4' } });
    binInputs
      .find('div.form-group')
      .at(3)
      .find('input')
      .simulate('change', { target: { value: 'foo,bar,bin,baz' } });
    await act(async () => await tickUpdate(result));
    result = result.update();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: 'col2',
      bins: '4',
      labels: 'foo,bar,bin,baz',
      operation: 'cut',
    });
    expect(result.find(BinsTester).find(ColumnAnalysisChart)).toHaveLength(1);
    result.find('div.modal-footer').first().find('button').first().simulate('click');
    await tickUpdate(result);

    const cfg = { col: null } as any;
    expect(validateBinsCfg(t, cfg)).toBe('Missing a column selection!');
    cfg.col = 'x';
    cfg.bins = '';
    expect(validateBinsCfg(t, cfg)).toBe('Missing a bins selection!');
    cfg.bins = '4';
    cfg.labels = 'foo';
    expect(validateBinsCfg(t, cfg)).toBe('There are 4 bins, but you have only specified 1 labels!');
  });
});
