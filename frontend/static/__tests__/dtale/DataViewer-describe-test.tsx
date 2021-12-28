import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { ColumnAnalysisChart } from '../../popups/analysis/ColumnAnalysisChart';
import CategoryInputs from '../../popups/analysis/filters/CategoryInputs';
import DescribeFilters from '../../popups/analysis/filters/DescribeFilters';
import { Describe } from '../../popups/describe/Describe';
import { Details } from '../../popups/describe/Details';
import DetailsCharts from '../../popups/describe/DetailsCharts';
import DtypesGrid from '../../popups/describe/DtypesGrid';
import * as GenericRepository from '../../repository/GenericRepository';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS, tick, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  let result: ReactWrapper;
  let postSpy: jest.SpyInstance<Promise<unknown>, [string, unknown]>;

  const { close, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();

    delete window.opener;
    delete (window as any).close;
    window.opener = { location: { reload: jest.fn() } };
    window.close = jest.fn();

    mockChartJS();
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));

    postSpy = jest.spyOn(GenericRepository, 'postDataToService');
    postSpy.mockResolvedValue(Promise.resolve({ data: {} }));
    const props = { dataId: '1', chartData: { visible: true } };
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store as any);
    result = mount(
      <Provider store={store}>
        <Describe {...props} />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await tickUpdate(result);
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    window.opener = opener;
    window.close = close;
  });

  const dtypesGrid = (): ReactWrapper => result.find(DtypesGrid).first();
  const details = (): ReactWrapper => result.find(Details).first();

  it('DataViewer: describe base grid operations', async () => {
    details()
      .find('button')
      .findWhere((btn) => btn.text() === 'Diffs')
      .first()
      .simulate('click');
    expect(
      details()
        .find('span.font-weight-bold')
        .findWhere((span) => span.text() === 'Sequential Difference Values (top 100 most common):'),
    ).not.toHaveLength(0);
    details()
      .find('button')
      .findWhere((btn) => btn.text() === 'Outliers')
      .first()
      .simulate('click');
    await tickUpdate(result);
    expect(result.find(DetailsCharts)).toHaveLength(1);
    expect(
      details()
        .find('span.font-weight-bold')
        .findWhere((span) => span.text() === '3 Outliers Found (top 100):'),
    ).not.toHaveLength(0);
    details().find('a').last().simulate('click');
    await tick();
    expect(dtypesGrid().find("div[role='row']").length).toBe(5);
    dtypesGrid().find("div[role='columnheader']").first().simulate('click');
    expect(
      dtypesGrid().find('div.headerCell').first().find('svg.ReactVirtualized__Table__sortableHeaderIcon--ASC').length,
    ).toBe(1);
    dtypesGrid().find("div[role='columnheader']").first().simulate('click');
    expect(
      dtypesGrid().find('div.headerCell').first().find('svg.ReactVirtualized__Table__sortableHeaderIcon--DESC').length,
    ).toBe(1);
    dtypesGrid().find("div[role='columnheader']").first().simulate('click');
    expect(
      dtypesGrid().find('div.headerCell').first().find('svg.ReactVirtualized__Table__sortableHeaderIcon').length,
    ).toBe(0);
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
    dtypesGrid()
      .find('div.headerCell')
      .at(2)
      .find('input')
      .first()
      .simulate('change', { target: { value: '1' } });
    expect(dtypesGrid().find("div[role='row']").length).toBe(2);
    dtypesGrid().find("div[title='col1']").first().simulate('click');
    await tickUpdate(result);
    expect(result.find(Details).find('div.row').first().find('span').first().text()).toBe('col1');
    dtypesGrid().find('div.headerCell').at(1).find('i.ico-check-box').simulate('click');
    dtypesGrid().find('div.headerCell').at(1).find('i.ico-check-box-outline-blank').simulate('click');
    dtypesGrid().find('i.ico-check-box').last().simulate('click');
    result.find('div.modal-footer').first().find('button').first().simulate('click');
    await tickUpdate(result);
    expect(postSpy).toBeCalledTimes(1);
    const firstPostCall = postSpy.mock.calls[0];
    expect(firstPostCall[0]).toBe('/dtale/update-visibility/1');
    expect((firstPostCall[1] as any).visibility).toBe('{"col1":false,"col2":true,"col3":true,"col4":true}');
  });
});
