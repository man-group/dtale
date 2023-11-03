import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

import { ColumnDef } from '../../../dtale/DataViewerState';
import { DetailsCharts, DetailsChartsProps } from '../../../popups/describe/DetailsCharts';
import * as ColumnAnalysisRepository from '../../../repository/ColumnAnalysisRepository';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, mockChartJS, parseUrlParams, selectOption } from '../../test-utils';
import { ANALYSIS_DATA } from '../ColumnAnalysis.test.support';

describe('DetailsCharts tests', () => {
  let loadAnalysisSpy: jest.SpyInstance<
    Promise<ColumnAnalysisRepository.ColumnAnalysisResponse | undefined>,
    [dataId: string, params: Record<string, any>]
  >;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  const updateProps = async (propOverrides?: Partial<DetailsChartsProps>): Promise<void> => {
    const props = {
      details: {
        describe: {},
        uniques: { data: [] },
        dtype_counts: [],
        sequential_diffs: { diffs: { data: [] }, min: '', max: '', avg: '' },
        string_metrics: {},
      },
      cols: ANALYSIS_DATA.cols as ColumnDef[],
      dtype: 'string',
      col: 'strCol',
      propagateState: jest.fn(),
      filtered: false,
      ...propOverrides,
    };
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);

    await act(
      () =>
        render(
          <Provider store={store}>
            <DetailsCharts {...props} />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    loadAnalysisSpy = jest.spyOn(ColumnAnalysisRepository, 'loadAnalysis');
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/column-analysis')) {
        const params = parseUrlParams(url);
        const ordinal = ANALYSIS_DATA.data;
        if (params.col === 'strCol') {
          if (params.type === 'frequency') {
            if (params.splits === 'intCol') {
              return Promise.resolve({
                data: {
                  ...ANALYSIS_DATA,
                  dtype: 'string',
                  chart_type: 'frequency',
                  timestamp: new Date().getTime(),
                  data: {
                    strCol: ['a', 'a', 'b', 'b', 'c', 'c', 'd', 'd', 'd'],
                    intCol: [0, 1, 0, 1, 0, 1, 0, 1, 'Missing'],
                    Frequency: [1, 2, 2, 1, 2, 2, 3, 1, 1],
                    Percent: [33.33, 66.66, 66.66, 33.33, 50.0, 50.0, 60.0, 20.0, 20.0],
                  },
                },
              });
            }
            return Promise.resolve({
              data: {
                ...ANALYSIS_DATA,
                dtype: 'string',
                chart_type: 'frequency',
                timestamp: new Date().getTime(),
                data: {
                  strCol: ['a', 'b', 'c', 'd'],
                  Frequency: [3, 3, 4, 5],
                  Percent: [20.0, 20.0, 26.67, 33.33],
                },
              },
            });
          }
          return Promise.resolve({
            data: {
              ...ANALYSIS_DATA,
              dtype: 'string',
              chart_type: 'value_counts',
              ordinal,
              timestamp: new Date().getTime(),
            },
          });
        }
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
  });

  afterEach(jest.restoreAllMocks);
  afterAll(dimensions.afterAll);

  it('frequency grid functionality', async () => {
    await updateProps();
    await act(async () => {
      await fireEvent.click(screen.getByText('Frequency Table'));
    });
    expect(loadAnalysisSpy).toHaveBeenLastCalledWith('1', {
      selectedCol: 'strCol',
      query: '',
      bins: 20,
      top: 100,
      density: false,
      type: 'frequency',
      filtered: false,
      splits: '',
    });
    let rows = screen.getByTestId('frequencies-grid').getElementsByClassName('ReactVirtualized__Table__row');
    expect(rows).toHaveLength(5);
    expect(rows[rows.length - 1].textContent).toBe('TOTAL15100.00%');
    await selectOption(
      screen.getByTestId('splits-select').getElementsByClassName('Select')[0] as HTMLElement,
      'intCol',
    );
    expect(loadAnalysisSpy).toHaveBeenLastCalledWith('1', {
      selectedCol: 'strCol',
      query: '',
      bins: 20,
      top: 100,
      density: false,
      type: 'frequency',
      filtered: false,
      splits: 'intCol',
    });
    rows = screen.getByTestId('frequencies-grid').getElementsByClassName('ReactVirtualized__Table__row');
    expect(rows).toHaveLength(13);
    expect(rows[rows.length - 1].textContent).toBe('TOTAL5100.00%');
    await act(async () => {
      fireEvent.change(screen.getByTestId('strCol-freq-filter'), { target: { value: 'c' } });
    });
    rows = screen.getByTestId('frequencies-grid').getElementsByClassName('ReactVirtualized__Table__row');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toBe('c0250.00%');
  });
});
