import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Table } from 'react-virtualized';

import { ColumnAnalysisChart } from '../../popups/analysis/ColumnAnalysisChart';
import CategoryInputs from '../../popups/analysis/filters/CategoryInputs';
import DescribeFilters from '../../popups/analysis/filters/DescribeFilters';
import Describe from '../../popups/describe/Describe';
import Details, { DetailsProps } from '../../popups/describe/Details';
import { DetailsCharts } from '../../popups/describe/DetailsCharts';
import DtypesGrid, { DtypesGridProps } from '../../popups/describe/DtypesGrid';
import { DescribePopupData } from '../../redux/state/AppState';
import * as GenericRepository from '../../repository/GenericRepository';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  let result: ReactWrapper;
  let postSpy: jest.SpyInstance<Promise<unknown>, [string, unknown]>;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  const { close, opener } = window;

  beforeAll(() => {
    dimensions.beforeAll();
    delete window.opener;
    delete (window as any).close;
    window.opener = { location: { reload: jest.fn() } };
    window.close = jest.fn();
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));

    postSpy = jest.spyOn(GenericRepository, 'postDataToService');
    postSpy.mockResolvedValue(Promise.resolve({ data: {} }));

    const store = reduxUtils.createDtaleStore();
    store.getState().dataId = '1';
    store.getState().chartData = { visible: true } as DescribePopupData;
    buildInnerHTML({ settings: '' }, store);
    result = mount(
      <Provider store={store}>
        <Describe />
      </Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    window.opener = opener;
    window.close = close;
  });

  const dtypesGrid = (): ReactWrapper<DtypesGridProps, Record<string, any>> => result.find(DtypesGrid).first();
  const details = (): ReactWrapper<DetailsProps, Record<string, any>> => result.find(Details).first();
  const clickHeaderSort = async (colIndex: number): Promise<ReactWrapper> => {
    await act(async () => {
      dtypesGrid().find("div[role='columnheader']").at(colIndex).simulate('click');
    });
    return result.update();
  };

  it('DataViewer: describe base grid operations', async () => {
    await act(async () => {
      details()
        .find('button')
        .findWhere((btn) => btn.text() === 'Diffs')
        .first()
        .simulate('click');
    });
    result = result.update();
    expect(
      details()
        .find('span.font-weight-bold')
        .findWhere((span) => span.text() === 'Sequential Difference Values (top 100 most common):'),
    ).not.toHaveLength(0);
    await act(async () => {
      details()
        .find('button')
        .findWhere((btn) => btn.text() === 'Outliers')
        .first()
        .simulate('click');
    });
    result = result.update();
    expect(result.find(DetailsCharts)).toHaveLength(1);
    expect(
      details()
        .find('span.font-weight-bold')
        .findWhere((span) => span.text() === '3 Outliers Found (top 100):'),
    ).not.toHaveLength(0);
    await act(async () => {
      details().find('a').last().simulate('click');
    });
    result = result.update();
    expect(dtypesGrid().find("div[role='row']").length).toBe(5);
    expect(dtypesGrid().find(Table).props()).toEqual(
      expect.objectContaining({ sortBy: 'index', sortDirection: 'ASC' }),
    );
    result = await clickHeaderSort(1);
    expect(dtypesGrid().find(Table).props()).toEqual(
      expect.objectContaining({ sortBy: 'visible', sortDirection: 'ASC' }),
    );
    result = await clickHeaderSort(1);
    expect(dtypesGrid().find(Table).props()).toEqual(
      expect.objectContaining({ sortBy: 'visible', sortDirection: 'DESC' }),
    );
    result = await clickHeaderSort(1);
    expect(dtypesGrid().find(Table).props()).toEqual(
      expect.objectContaining({ sortBy: 'index', sortDirection: 'ASC' }),
    );
    result = await clickHeaderSort(2);
    expect(dtypesGrid().find(Table).props()).toEqual(expect.objectContaining({ sortBy: 'name', sortDirection: 'ASC' }));
    await act(async () => {
      result
        .find(DescribeFilters)
        .find('button')
        .findWhere((btn) => btn.text() === 'Histogram')
        .first()
        .simulate('click');
    });
    result = result.update();
    expect(result.find(ColumnAnalysisChart)).toHaveLength(1);
    await act(async () => {
      result
        .find(DescribeFilters)
        .find('button')
        .findWhere((btn) => btn.text() === 'Categories')
        .first()
        .simulate('click');
    });
    result = result.update();
    expect(result.find('div.missing-category')).toHaveLength(1);
    await act(async () => {
      result.find(CategoryInputs).first().props().setCategoryCol({ value: 'foo', label: 'foo' });
    });
    result = result.update();
    expect(result.find(ColumnAnalysisChart)).toHaveLength(1);
  });

  it('DataViewer: showing/hiding columns from Describe popup & jumping sessions', async () => {
    await act(async () => {
      dtypesGrid()
        .find('div.headerCell')
        .at(2)
        .find('input')
        .first()
        .simulate('change', { target: { value: '1' } });
    });
    result = result.update();
    expect(dtypesGrid().find("div[role='row']")).toHaveLength(2);
    await act(async () => {
      dtypesGrid().find("div[title='col1']").first().simulate('click');
    });
    result = result.update();
    expect(result.find(Details).find('div.row').first().find('span').first().text()).toBe('col1');
    await act(async () => {
      dtypesGrid().find('div.headerCell').at(1).find('i.ico-check-box').simulate('click');
    });
    result = result.update();
    await act(async () => {
      dtypesGrid().find('div.headerCell').at(1).find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    await act(async () => {
      dtypesGrid().find('i.ico-check-box').last().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find('div.modal-footer').first().find('button').first().simulate('click');
    });
    result = result.update();
    expect(postSpy).toBeCalledTimes(1);
    const firstPostCall = postSpy.mock.calls[0];
    expect(firstPostCall[0]).toBe('/dtale/update-visibility/1');
    expect((firstPostCall[1] as any).visibility).toBe('{"col1":false,"col2":true,"col3":true,"col4":true}');
  });
});
