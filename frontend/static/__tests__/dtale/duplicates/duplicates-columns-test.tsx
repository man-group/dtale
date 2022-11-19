import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

import Duplicates from '../../../popups/duplicates/Duplicates';
import { DuplicatesActionType, DuplicatesConfigType, KeepType } from '../../../popups/duplicates/DuplicatesState';
import { ActionType } from '../../../redux/actions/AppActions';
import { PopupType } from '../../../redux/state/AppState';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, parseUrlParams, selectOption } from '../../test-utils';

describe('Duplicates', () => {
  const { location, open, opener } = window;
  let result: Element;

  beforeAll(() => {
    delete (window as any).location;
    delete (window as any).open;
    delete window.opener;
    (window as any).location = {
      href: 'http://localhost:8080/dtale/main/1',
      reload: jest.fn(),
      pathname: '/dtale/column/1',
      assign: jest.fn(),
    };
    window.open = jest.fn();
    window.opener = { code_popup: { code: 'test code', title: 'Test' } };
  });

  beforeEach(async () => {
    (axios.get as any).mockImplementation(async (url: string) => {
      if (url.startsWith('/dtale/duplicates')) {
        const urlParams = parseUrlParams(url);
        if (urlParams.action === DuplicatesActionType.TEST) {
          const cfg = JSON.parse(decodeURIComponent(urlParams.cfg));
          if (urlParams.type === DuplicatesConfigType.SHOW) {
            if (cfg.group?.[0] === 'foo') {
              return Promise.resolve({ data: { results: {} } });
            } else if (!cfg.group?.length) {
              return Promise.resolve({ data: { error: 'Failure' } });
            }
            return Promise.resolve({
              data: {
                results: {
                  'a, b': { count: 3, filter: ['a', 'b'] },
                },
              },
            });
          }
          if (cfg.keep === KeepType.FIRST) {
            if (urlParams.type === DuplicatesConfigType.ROWS) {
              return Promise.resolve({ data: { results: 3 } });
            }
            return Promise.resolve({ data: { results: { Foo: ['foo'] } } });
          } else if (cfg.keep === KeepType.LAST) {
            if (urlParams.type === DuplicatesConfigType.ROWS) {
              return Promise.resolve({ data: { results: 0 } });
            }
            return Promise.resolve({ data: { results: {} } });
          } else {
            return Promise.resolve({ data: { error: 'Failure' } });
          }
        } else {
          return Promise.resolve({ data: { data_id: 1 } });
        }
      }
      if (url.startsWith('/dtale/dtypes')) {
        const dtypes = JSON.parse(JSON.stringify(reduxUtils.DTYPES));
        dtypes.dtypes[0].name = 'foo';
        dtypes.dtypes[1].name = 'bar';
        dtypes.dtypes[2].name = 'baz';
        return Promise.resolve({ data: dtypes });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch({
      type: ActionType.OPEN_CHART,
      chartData: { type: PopupType.DUPLICATES, visible: true, selectedCol: 'foo' },
    });
    result = await act(
      () =>
        render(
          <Provider store={store}>
            <Duplicates />
          </Provider>,
          { container: document.getElementById('content') ?? undefined },
        ).container,
    );
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => {
    window.location = location;
    window.open = open;
    window.opener = opener;
  });

  const toggleType = async (text: string): Promise<void> => {
    await act(async () => {
      await fireEvent.click(screen.getByText(text));
    });
  };

  const selects = (idx = 0): HTMLElement =>
    result.querySelector('div.modal-body')!.getElementsByClassName('Select')[idx] as HTMLElement;

  describe('Columns', () => {
    beforeEach(async () => {
      await toggleType('Remove Duplicate Columns');
    });

    it('handles duplicates', async () => {
      expect(screen.getByText('View Duplicates')).toBeDefined();
      await selectOption(selects(), 'First');
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      await act(async () => {
        await fireEvent.click(screen.getByText('Execute'));
      });
      expect(window.location.assign).toBeCalledWith('http://localhost:8080/dtale/main/1');
    });

    it('handles no duplicates', async () => {
      await selectOption(selects(), 'Last');
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      expect(screen.getByText('No duplicate columns exist.')).toBeDefined();
    });

    it('handles error', async () => {
      await selectOption(selects(), 'None');
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });

  describe('Column Names', () => {
    beforeEach(async () => {
      await toggleType('Remove Duplicate Column Names');
    });

    it('handles duplicates', async () => {
      expect(screen.getByText('View Duplicates')).toBeDefined();
      await selectOption(selects(), 'First');
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      await act(async () => {
        await fireEvent.click(screen.getByText('Execute'));
      });
      expect(window.location.assign).toBeCalledWith('http://localhost:8080/dtale/main/1');
    });

    it('handles no duplicates', async () => {
      await selectOption(selects(), 'Last');
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      expect(screen.getByText('No duplicate column names exist.')).toBeDefined();
    });

    it('handles error', async () => {
      await selectOption(selects(), 'None');
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });

  describe('Rows', () => {
    beforeEach(async () => {
      await toggleType('Remove Duplicate Rows');
    });

    it('handles duplicates', async () => {
      expect(screen.getByText('View Duplicates')).toBeDefined();
      await selectOption(selects(1), ['foo', 'bar']);
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      await act(async () => {
        await fireEvent.click(screen.getByText('Execute'));
      });
      expect(window.location.assign).toBeCalledWith('http://localhost:8080/dtale/main/1');
    });

    it('handles no duplicate rows', async () => {
      await selectOption(selects(), 'Last');
      await selectOption(selects(1), ['foo', 'bar']);
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      expect(screen.getByText('No duplicate rows exist for the column(s): foo, bar')).toBeDefined();
    });

    it('handles error', async () => {
      await selectOption(selects(), 'None');
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });

  describe('Show Duplicates', () => {
    beforeEach(async () => {
      await toggleType('Show Duplicates');
    });

    it('handles duplicates', async () => {
      expect(screen.getByText('View Duplicates')).toBeDefined();
      await selectOption(selects(), 'bar');
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      await act(async () => {
        await fireEvent.click(screen.getByText('Execute'));
      });
      expect(window.location.assign).toBeCalledWith('http://localhost:8080/dtale/main/1');
    });

    it('handles no duplicates', async () => {
      await selectOption(selects(), 'foo');
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      expect(screen.getByText('No duplicates exist in any of the (foo) groups')).toBeDefined();
    });

    it('handles error', async () => {
      await act(async () => {
        await fireEvent.click(screen.getByText('View Duplicates'));
      });
      await selectOption(selects(), 'baz');
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });
});
