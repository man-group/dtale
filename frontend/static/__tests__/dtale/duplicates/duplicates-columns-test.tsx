import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { default as Select } from 'react-select';

import { BouncerWrapper } from '../../../BouncerWrapper';
import ColumnNames from '../../../popups/duplicates/ColumnNames';
import Columns from '../../../popups/duplicates/Columns';
import Duplicates from '../../../popups/duplicates/Duplicates';
import { DuplicatesActionType, DuplicatesConfigType, KeepType } from '../../../popups/duplicates/DuplicatesState';
import Rows from '../../../popups/duplicates/Rows';
import ShowDuplicates from '../../../popups/duplicates/ShowDuplicates';
import { PopupType } from '../../../redux/state/AppState';
import { RemovableError } from '../../../RemovableError';
import reduxUtils from '../../redux-test-utils';
import { parseUrlParams, tickUpdate } from '../../test-utils';

describe('Duplicates', () => {
  const { location, open, opener } = window;
  let result: ReactWrapper;

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
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation(async (url: string) => {
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
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });

    const store = reduxUtils.createDtaleStore();
    store.getState().dataId = '1';
    store.getState().chartData = { type: PopupType.DUPLICATES, visible: true, selectedCol: 'foo' };
    result = mount(
      <Provider store={store}>
        <Duplicates />
      </Provider>,
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => {
    window.location = location;
    window.open = open;
    window.opener = opener;
  });

  const toggleType = async (btnIdx = 0): Promise<ReactWrapper> => {
    await act(async () => {
      result.find(Duplicates).find('div.modal-body').find('button').at(btnIdx).simulate('click');
    });
    return result.update();
  };

  describe('Columns', () => {
    const columnsComp = (): ReactWrapper => result.find(Columns);

    beforeEach(async () => {
      result = await toggleType();
    });

    it('handles duplicates', async () => {
      expect(columnsComp()).toHaveLength(1);
      await act(async () => {
        columnsComp().find(Select).first().props().onChange({ value: KeepType.FIRST });
      });
      result = result.update();
      await act(async () => {
        columnsComp().find('button').last().simulate('click');
      });
      result = result.update();
      await act(async () => {
        result.find('div.modal-footer').first().find('button').first().simulate('click');
      });
      result = result.update();
      expect(window.location.assign).toBeCalledWith('http://localhost:8080/dtale/main/1');
    });

    it('handles no duplicates', async () => {
      await act(async () => {
        columnsComp().find(Select).first().props().onChange({ value: KeepType.LAST });
      });
      result = result.update();
      await act(async () => {
        columnsComp().find('button').last().simulate('click');
      });
      result = result.update();
      expect(result.find(Columns).find(BouncerWrapper).last().text()).toBe('No duplicate columns exist.');
    });

    it('handles error', async () => {
      await act(async () => {
        columnsComp().find(Select).first().props().onChange({ value: KeepType.NONE });
      });
      result = result.update();
      await act(async () => {
        columnsComp().find('button').last().simulate('click');
      });
      result = result.update();
      expect(result.find(Columns).find(RemovableError)).toHaveLength(1);
    });
  });

  describe('Column Names', () => {
    const columnNamesComp = (): ReactWrapper => result.find(ColumnNames);

    beforeEach(async () => {
      result = await toggleType(1);
    });

    it('handles duplicates', async () => {
      expect(columnNamesComp()).toHaveLength(1);
      await act(async () => {
        columnNamesComp().find(Select).first().props().onChange({ value: KeepType.FIRST });
      });
      result = result.update();
      await act(async () => {
        columnNamesComp().find('button').last().simulate('click');
      });
      result = result.update();
      await act(async () => {
        result.find('div.modal-footer').first().find('button').first().simulate('click');
      });
      result = result.update();
      expect(window.location.assign).toBeCalledWith('http://localhost:8080/dtale/main/1');
    });

    it('handles no duplicates', async () => {
      await act(async () => {
        columnNamesComp().find(Select).first().props().onChange({ value: KeepType.LAST });
      });
      result = result.update();
      await act(async () => {
        columnNamesComp().find('button').last().simulate('click');
      });
      result = result.update();
      expect(result.find(ColumnNames).find(BouncerWrapper).last().text()).toBe('No duplicate column names exist.');
    });

    it('handles error', async () => {
      await act(async () => {
        columnNamesComp().find(Select).first().props().onChange({ value: KeepType.NONE });
      });
      result = result.update();
      await act(async () => {
        columnNamesComp().find('button').last().simulate('click');
      });
      result = result.update();
      expect(result.find(ColumnNames).find(RemovableError)).toHaveLength(1);
    });
  });

  describe('Rows', () => {
    const rowsComp = (): ReactWrapper => result.find(Rows);

    beforeEach(async () => {
      result = await toggleType(2);
    });

    it('handles duplicates', async () => {
      expect(rowsComp()).toHaveLength(1);
      await act(async () => {
        rowsComp().find(Select).first().props().onChange({ value: KeepType.FIRST });
      });
      result = result.update();
      await act(async () => {
        rowsComp()
          .find(Select)
          .last()
          .props()
          .onChange([{ value: 'foo' }, { value: 'bar' }]);
      });
      result = result.update();
      await act(async () => {
        rowsComp().find('button').last().simulate('click');
      });
      result = result.update();
      await act(async () => {
        result.find('div.modal-footer').first().find('button').first().simulate('click');
      });
      result = result.update();
      expect(window.location.assign).toBeCalledWith('http://localhost:8080/dtale/main/1');
    });

    it('handles no duplicate rows', async () => {
      await act(async () => {
        rowsComp().find(Select).first().props().onChange({ value: KeepType.LAST });
      });
      result = result.update();
      await act(async () => {
        rowsComp()
          .find(Select)
          .last()
          .props()
          .onChange([{ value: 'foo' }, { value: 'bar' }]);
      });
      result = result.update();
      await act(async () => {
        rowsComp().find('button').last().simulate('click');
      });
      result = result.update();
      expect(result.find(Rows).find(BouncerWrapper).last().text()).toBe(
        'No duplicate rows exist for the column(s): foo, bar',
      );
    });

    it('handles error', async () => {
      await act(async () => {
        rowsComp().find(Select).first().props().onChange({ value: KeepType.NONE });
      });
      result = result.update();
      await act(async () => {
        rowsComp().find('button').last().simulate('click');
      });
      result = result.update();
      expect(result.find(Rows).find(RemovableError)).toHaveLength(1);
    });
  });

  describe('ShowDuplicates', () => {
    const showDuplicatesComp = (): ReactWrapper => result.find(ShowDuplicates);

    beforeEach(async () => {
      result = await toggleType(3);
    });

    it('handles duplicates', async () => {
      expect(showDuplicatesComp()).toHaveLength(1);
      await act(async () => {
        showDuplicatesComp()
          .find(Select)
          .first()
          .props()
          .onChange([{ value: 'bar' }]);
      });
      result = result.update();
      await act(async () => {
        showDuplicatesComp().find('button').last().simulate('click');
      });
      result = result.update();
      await act(async () => {
        result.find('div.modal-footer').first().find('button').first().simulate('click');
      });
      result = result.update();
      expect(window.location.assign).toBeCalledWith('http://localhost:8080/dtale/main/1');
    });

    it('handles no duplicates', async () => {
      await act(async () => {
        showDuplicatesComp()
          .find(Select)
          .first()
          .props()
          .onChange([{ value: 'foo' }]);
      });
      result = result.update();
      await act(async () => {
        showDuplicatesComp().find('button').last().simulate('click');
      });
      result = result.update();
      expect(showDuplicatesComp().find(BouncerWrapper).last().text()).toBe(
        'No duplicates exist in any of the (foo) groups',
      );
    });

    it('handles error', async () => {
      await act(async () => {
        showDuplicatesComp().find('button').last().simulate('click');
      });
      result = result.update();
      await act(async () => {
        showDuplicatesComp()
          .find(Select)
          .first()
          .props()
          .onChange([{ value: 'baz' }]);
      });
      result = result.update();
      expect(showDuplicatesComp().find(RemovableError)).toHaveLength(1);
    });
  });
});
