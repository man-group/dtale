import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import { BouncerWrapper } from '../../../BouncerWrapper';
import ButtonToggle from '../../../ButtonToggle';
import MissingNoCharts, { MissingNoChart } from '../../../dtale/side/MissingNoCharts';
import FilterSelect from '../../../popups/analysis/filters/FilterSelect';
import ColumnSelect from '../../../popups/create/ColumnSelect';
import { RemovableError } from '../../../RemovableError';
import * as DtypesRepository from '../../../repository/DtypesRepository';
import reduxUtils from '../../redux-test-utils';
import { tickUpdate } from '../../test-utils';

describe('MissingNoCharts', () => {
  let wrapper: ReactWrapper;
  const dispatchSpy = jest.fn();
  const openSpy = jest.fn();

  const { open } = window;

  const buildMock = async (): Promise<void> => {
    wrapper = mount(<MissingNoCharts />);
    await act(async () => tickUpdate(wrapper));
    wrapper = wrapper.update();
  };

  beforeAll(() => {
    delete (window as any).open;
    window.open = openSpy;
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue('1');
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    await buildMock();
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    jest.restoreAllMocks();
    window.open = open;
  });

  const clickBtn = async (index = 0): Promise<ReactWrapper> => {
    await act(async () => {
      wrapper.find('button').at(index).simulate('click');
    });
    return wrapper.update();
  };

  it('renders successfully', async () => {
    expect(wrapper.find('img')).toHaveLength(1);
    expect(wrapper.find(ButtonToggle).props().defaultValue).toBe(MissingNoChart.HEATMAP);
    expect(wrapper.find(BouncerWrapper).props().showBouncer).toBe(true);
    expect(
      wrapper.find('img').props().src?.startsWith('/dtale/missingno/heatmap/1?date_index=col4&freq=BQ'),
    ).toBeTruthy();
    wrapper = await clickBtn(1);
    expect(
      openSpy.mock.calls[0][0].startsWith('/dtale/missingno/heatmap/1?date_index=col4&freq=BQ&file=true'),
    ).toBeTruthy();
  });

  const updateChartType = async (chartType: MissingNoChart): Promise<ReactWrapper> => {
    await act(async () => {
      wrapper.find(ButtonToggle).props().update(chartType);
    });
    return wrapper.update();
  };

  it('updates URLs on chart prop changes', async () => {
    wrapper = await updateChartType(MissingNoChart.BAR);
    expect(wrapper.find('img').props().src?.startsWith('/dtale/missingno/bar/1?date_index=col4&freq=BQ')).toBeTruthy();
    wrapper = await clickBtn(1);
    expect(
      openSpy.mock.calls[0][0].startsWith('/dtale/missingno/bar/1?date_index=col4&freq=BQ&file=true'),
    ).toBeTruthy();
  });

  it('includes date col & freq in matrix chart', async () => {
    wrapper = await updateChartType(MissingNoChart.MATRIX);
    const columnSelectProps = wrapper.find(ColumnSelect).first().props();
    await act(async () => {
      columnSelectProps.updateState({ dateCol: { value: columnSelectProps.columns[0].name } });
    });
    wrapper = wrapper.update();
    const freqSelect = wrapper.find(FilterSelect).first().props();
    await act(async () => {
      freqSelect.onChange(freqSelect.options[1]);
    });
    wrapper = wrapper.update();
    wrapper = await clickBtn();
    let urlExpected = '/dtale/missingno/matrix/1?date_index=col4&freq=C';
    expect(openSpy.mock.calls[0][0].startsWith(urlExpected)).toBeTruthy();
    wrapper = await clickBtn(1);
    urlExpected = `${urlExpected}&file=true`;
    expect(openSpy.mock.calls[1][0].startsWith(urlExpected)).toBeTruthy();
  });

  it('image loading updates state', async () => {
    await act(async () => {
      wrapper
        .find('img')
        .props()
        .onLoad?.({} as React.SyntheticEvent<HTMLImageElement>);
    });
    wrapper = wrapper.update();
    expect(wrapper.find(BouncerWrapper).props().showBouncer).toBe(false);
  });

  it('shows error when image cannot be rendered', async () => {
    await act(async () => {
      wrapper
        .find('img')
        .props()
        .onError?.({} as React.SyntheticEvent<HTMLImageElement>);
    });
    wrapper = wrapper.update();
    expect(wrapper.find(RemovableError)).toHaveLength(1);
  });

  it('handles dtype loading error gracefully', async () => {
    const loadDtypesSpy = jest.spyOn(DtypesRepository, 'loadDtypes');
    loadDtypesSpy.mockResolvedValue({ error: 'dtype error', success: false, dtypes: [] });
    await buildMock();
    expect(wrapper.find(RemovableError)).toHaveLength(1);
    loadDtypesSpy.mockRestore();
  });
});
