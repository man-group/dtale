import { act, fireEvent, getByRole, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';

import Popup from '../../popups/Popup';
import { ActionType } from '../../redux/actions/AppActions';
import { AppState, PopupType } from '../../redux/state/AppState';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, FakeMouseEvent } from '../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('ExportOption', () => {
  const openSpy = jest.fn();
  const mockDispatch = jest.fn();
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    delete (window as any).open;
    window.open = openSpy;
    dimensions.beforeAll();
  });

  const setupMock = async (overrides?: Partial<AppState>): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ dataId: '0', settings: '' }, store);
    store.dispatch({ type: ActionType.UPDATE_SETTINGS, settings: { sortInfo: [], ...overrides?.settings } });
    store.dispatch({
      type: ActionType.OPEN_CHART,
      chartData: { visible: true, type: PopupType.EXPORT, rows: 50, ...overrides?.chartData },
    });
    await act(
      () =>
        render(
          <Provider store={store}>
            <Popup propagateState={jest.fn()} />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  beforeEach(() => {
    (Element.prototype as any).getBoundingClientRect = jest.fn(() => {
      return {
        width: 0,
        height: 100,
        top: 0,
        left: 0,
        bottom: 0,
        right: 11000,
      };
    });
    useDispatchMock.mockImplementation(() => mockDispatch);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    window.open = open;
    dimensions.afterAll();
  });

  it('fires CSV export action', async () => {
    await setupMock();
    await act(async () => {
      await fireEvent.click(screen.getByText('CSV'));
    });
    expect(openSpy.mock.calls[0][0].startsWith('/dtale/data-export/0?type=csv&_id=')).toBe(true);
  });

  it('fires TSV export action', async () => {
    await setupMock();
    await act(async () => {
      await fireEvent.click(screen.getByText('TSV'));
    });
    expect(openSpy.mock.calls[0][0].startsWith('/dtale/data-export/0?type=tsv&_id=')).toBe(true);
  });

  it('fires parquet export action', async () => {
    await setupMock();
    await act(async () => {
      await fireEvent.click(screen.getByText('Parquet'));
    });
    expect(openSpy.mock.calls[0][0].startsWith('/dtale/data-export/0?type=parquet&_id=')).toBe(true);
  });

  it('fires html export action', async () => {
    await setupMock();
    await act(async () => {
      await fireEvent.click(screen.getByText('html'));
    });
    expect(openSpy.mock.calls[0][0].startsWith('/dtale/data/0?export=true&export_rows=50&_id=')).toBe(true);
  });

  describe('HTML export over 10000 rows', () => {
    beforeEach(async () => {
      await setupMock({ chartData: { visible: true, type: PopupType.EXPORT, rows: 11000 } });
      await act(async () => {
        await fireEvent.click(screen.getByText('html'));
      });
    });

    it("doesn't call window.open on initial click", async () => {
      expect(document.body.querySelector('.modal-body')!.getElementsByClassName('row')).toHaveLength(4);
      expect(openSpy).not.toHaveBeenCalled();
    });

    it('calls window.open on button click', async () => {
      const thumb = getByRole(document.body.querySelector('.modal-body')!, 'slider');
      await act(async () => {
        await fireEvent(thumb, new FakeMouseEvent('mousedown', { bubbles: true, pageX: 0, pageY: 0 }));
      });
      await act(async () => {
        await fireEvent(thumb, new FakeMouseEvent('mousemove', { bubbles: true, pageX: 1000, pageY: 0 }));
      });
      await act(async () => {
        await fireEvent.mouseUp(thumb);
      });
      await act(async () => {
        await fireEvent.change(document.body.querySelector('.modal-body')!.getElementsByTagName('input')[0], {
          target: { value: '1000' },
        });
      });
      await act(async () => {
        await fireEvent.click(screen.getByTestId('export-html'));
      });
      expect(openSpy.mock.calls[0][0].startsWith('/dtale/data/0?export=true&export_rows=1000&_id=')).toBe(true);
    });
  });
});
