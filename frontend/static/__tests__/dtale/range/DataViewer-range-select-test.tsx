import { act, fireEvent, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../../dtale/DataViewer';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, mockChartJS } from '../../test-utils';

describe('DataViewer tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

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

  it('DataViewer: range selection', async () => {
    const result = await build();
    const cells = result.getElementsByClassName('cell');
    await act(async () => {
      fireEvent.click(cells[15], { shiftKey: true });
    });
    await act(async () => {
      fireEvent.mouseOver(cells[cells.length - 1], { shiftKey: true });
    });
    await act(async () => {
      fireEvent.click(cells[cells.length - 1], { shiftKey: true });
    });
    expect(store.getState().rangeSelect).toEqual({
      start: '3|3',
      end: '4|5',
    });
    expect(store.getState().chartData.text).toBe('foo\t2000-01-01\nfoo\t\nfoo\t\n');
    const copyRange = document.getElementById('copy-range-to-clipboard')!;
    await act(async () => {
      fireEvent.click(copyRange.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    expect(copyRange.getElementsByTagName('pre')[0].textContent).toBe('col3\tcol4\nfoo\t2000-01-01\nfoo\t\nfoo\t\n');
    await act(async () => {
      fireEvent.click(document.getElementsByClassName('modal-footer')[0].getElementsByTagName('button')[0]);
    });
    expect(store.getState().rangeSelect).toBeNull();
  });
});
