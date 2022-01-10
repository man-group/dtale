import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { default as Select } from 'react-select';

import { DataViewer } from '../../../dtale/DataViewer';
import { ResampleConfig } from '../../../popups/create/CreateColumnState';
import { default as Resample, validateResampleCfg } from '../../../popups/reshape/Resample';
import { ReactReshape as Reshape } from '../../../popups/reshape/Reshape';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate } from '../../test-utils';

describe('Resample', () => {
  const { location, open, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 800,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });
  let result: ReactWrapper;

  beforeAll(() => {
    dimensions.beforeAll();

    delete (window as any).location;
    delete (window as any).open;
    delete window.opener;
    (window as any).location = {
      reload: jest.fn(),
      pathname: '/dtale/iframe/1',
      assign: jest.fn(),
    };
    window.open = jest.fn();
    window.opener = { code_popup: { code: 'test code', title: 'Test' } };

    mockChartJS();
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );
    await tick();
    await clickMainMenuButton(result, 'Summarize Data');
    await tickUpdate(result);
  });

  afterEach(() => {
    result.unmount();
    jest.resetAllMocks();
  });

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.open = open;
    window.opener = opener;
    jest.restoreAllMocks();
  });

  const findResample = (): ReactWrapper => result.find(Resample);

  it('resamples data', async () => {
    result.find(Reshape).find('div.modal-body').find('button').at(3).simulate('click');
    expect(findResample()).toHaveLength(1);
    await act(async () => {
      findResample().find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      findResample()
        .find('div.form-group.row')
        .at(2)
        .find('input')
        .first()
        .simulate('change', { target: { value: '17min' } });
    });
    result = result.update();
    await act(async () => {
      findResample().find(Select).last().props().onChange({ value: 'mean' });
    });
    result = result.update();
    result.find('div.modal-body').find('div.row').last().find('button').last().simulate('click');
    result.find('div.modal-footer').first().find('button').first().simulate('click');
    await tickUpdate(result);
    expect(result.find(Reshape)).toHaveLength(1);
    result.find('div.modal-body').find('div.row').last().find('button').first().simulate('click');
    result.find('div.modal-footer').first().find('button').first().simulate('click');
    await tickUpdate(result);
    expect(result.find(Reshape)).toHaveLength(0);
  });

  it('validates configuration', () => {
    const cfg: ResampleConfig = { freq: '' };
    expect(validateResampleCfg(cfg)).toBe('Missing an index selection!');
    cfg.index = 'x';
    expect(validateResampleCfg(cfg)).toBe('Missing offset!');
    cfg.freq = 'x';
    expect(validateResampleCfg(cfg)).toBe('Missing aggregation!');
    cfg.agg = 'x';
    expect(validateResampleCfg(cfg)).toBeUndefined();
  });
});
