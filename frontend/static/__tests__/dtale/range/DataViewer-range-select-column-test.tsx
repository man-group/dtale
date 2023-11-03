import { act, fireEvent, render, screen } from '@testing-library/react';
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
    offsetWidth: 1205,
    offsetHeight: 775,
    innerWidth: 1205,
    innerHeight: 775,
  });

  let buildCopyColumnsSpy: jest.SpyInstance;
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
    buildCopyColumnsSpy = jest.spyOn(CopyRangeRepository, 'buildCopyColumns');
    buildCopyColumnsSpy.mockResolvedValue({ text: TEXT, success: true });
    const buildCopyRowsSpy = jest.spyOn(CopyRangeRepository, 'buildCopyRows');
    buildCopyRowsSpy.mockResolvedValue({ text: TEXT, success: true });
  });

  const build = async (): Promise<HTMLElement> => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    return await act(() => {
      const { container } = render(
        <Provider store={store}>
          <DataViewer />
        </Provider>,
        {
          container: document.getElementById('content') as HTMLElement,
        },
      );
      return container;
    });
  };

  it('DataViewer: column range selection', async () => {
    await build();
    await act(async () => {
      fireEvent.click(screen.queryAllByTestId('header-cell')[0].getElementsByClassName('text-nowrap')[0], {
        shiftKey: true,
      });
    });
    expect(store.getState().columnRange).toEqual({
      start: 1,
      end: 1,
    });
    await act(async () => {
      fireEvent.mouseOver(screen.queryAllByTestId('header-cell')[1].getElementsByTagName('div')[0], { shiftKey: true });
    });
    expect(store.getState().columnRange).toEqual({
      start: 1,
      end: 2,
    });
    await act(async () => {
      fireEvent.click(screen.queryAllByTestId('header-cell')[1].getElementsByClassName('text-nowrap')[0], {
        shiftKey: true,
      });
    });
    expect(document.getElementById('copy-range-to-clipboard')).toBeDefined();
    expect(store.getState().chartData.text).toBe(TEXT);
    expect(buildCopyColumnsSpy).toBeCalledTimes(1);
    expect(buildCopyColumnsSpy).toBeCalledWith('1', ['col1', 'col2']);

    await act(async () => {
      fireEvent.click(document.getElementsByClassName('modal-footer')[0].getElementsByTagName('button')[0]);
    });
    expect(execCommandMock).toHaveBeenCalledTimes(1);
  });

  it('DataViewer: column ctrl selection', async () => {
    await build();
    let instance = screen.queryAllByTestId('header-cell')[0];
    await act(async () => {
      fireEvent.click(instance.getElementsByClassName('text-nowrap')[0], { ctrlKey: true });
    });
    expect(store.getState().ctrlCols).toEqual([1]);
    instance = screen.queryAllByTestId('header-cell')[1];
    await act(async () => {
      fireEvent.click(instance.getElementsByClassName('text-nowrap')[0], { ctrlKey: true });
    });
    expect(store.getState().ctrlCols).toEqual([1, 2]);
    instance = screen.queryAllByTestId('header-cell')[0];
    await act(async () => {
      fireEvent.click(instance.getElementsByClassName('text-nowrap')[0], { ctrlKey: true });
    });
    expect(store.getState().ctrlCols).toEqual([2]);
  });
});
