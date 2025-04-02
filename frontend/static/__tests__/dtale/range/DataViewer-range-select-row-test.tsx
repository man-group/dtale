import { act, fireEvent, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../../dtale/DataViewer';
import * as CopyRangeRepository from '../../../repository/CopyRangeRepository';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, mockChartJS } from '../../test-utils';

const TEXT = 'COPIED_TEXT';

describe('DataViewer tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  let buildCopyRowsSpy: jest.SpyInstance;
  const execCommandMock = jest.fn();
  let store: Store;

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    Object.defineProperty(global.document, 'execCommand', { value: execCommandMock });
  });

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    execCommandMock.mockReset();
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    const buildCopyColumnsSpy = jest.spyOn(CopyRangeRepository, 'buildCopyColumns');
    buildCopyColumnsSpy.mockResolvedValue({ text: TEXT, success: true });
    buildCopyRowsSpy = jest.spyOn(CopyRangeRepository, 'buildCopyRows');
    buildCopyRowsSpy.mockResolvedValue({ text: TEXT, success: true });
  });

  const build = async (): Promise<HTMLElement> => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    return await act(
      () =>
        render(
          <Provider store={store}>
            <DataViewer />
          </Provider>,
          {
            container: document.getElementById('content') as HTMLElement,
          },
        ).container,
    );
  };

  it('DataViewer: row range selection', async () => {
    const result = await build();
    await act(async () => {
      fireEvent.click(result.getElementsByClassName('cell')[0], { shiftKey: true });
    });
    expect(store.getState().rowRange).toEqual({
      start: 1,
      end: 1,
    });
    const cellOnRow2 = [...result.getElementsByClassName('cell')].find((c) =>
      c.getAttribute('cell_idx')?.endsWith('2'),
    )!;
    await act(async () => {
      fireEvent.mouseOver(cellOnRow2, { shiftKey: true });
    });
    expect(store.getState().rowRange).toEqual({
      start: 1,
      end: 2,
    });
    await act(async () => {
      fireEvent.click(cellOnRow2, { shiftKey: true });
    });
    const copyRange = document.getElementById('copy-range-to-clipboard')!;
    expect(copyRange.getElementsByTagName('pre')[0].textContent).toBe(TEXT);
    expect(buildCopyRowsSpy).toBeCalledTimes(1);
    expect(buildCopyRowsSpy).toBeCalledWith('1', ['col1', 'col2', 'col3', 'col4'], { start: '1', end: '2' });
  });
});
