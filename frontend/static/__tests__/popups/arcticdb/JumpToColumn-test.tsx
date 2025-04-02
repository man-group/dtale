import { act, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import selectEvent from 'react-select-event';

import * as serverState from '../../../dtale/serverStateManagement';
import JumpToColumn from '../../../popups/arcticdb/JumpToColumn';
import { AppActions } from '../../../redux/actions/AppActions';
import { JumpToColumnPopupData, PopupType } from '../../../redux/state/AppState';
import { mockColumnDef } from '../../mocks/MockColumnDef';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, selectOption } from '../../test-utils';

const props: JumpToColumnPopupData = {
  visible: true,
  type: PopupType.JUMP_TO_COLUMN,
  title: 'JumpToColumn Test',
  columns: [
    mockColumnDef({ index: 0, visible: true, locked: true }),
    mockColumnDef({
      name: 'foo',
      index: 1,
      dtype: 'int64',
      visible: true,
      width: 100,
      resized: true,
    }),
    mockColumnDef({
      name: 'bar',
      index: 2,
      dtype: 'bool',
      visible: true,
      width: 100,
      resized: false,
    }),
  ],
};

describe('JumpToColumn tests', () => {
  let serverStateSpy: jest.SpyInstance;
  let propagateStateSpy: jest.Mock;

  const updateProps = async (chartData?: Partial<JumpToColumnPopupData>): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', isArcticDB: '100' }, store);
    store.dispatch(AppActions.OpenChartAction({ ...props, ...chartData }));
    if (chartData?.visible === false) {
      store.dispatch(AppActions.CloseChartAction());
    }
    propagateStateSpy = jest.fn();
    await act(
      async () =>
        await render(
          <Provider store={store}>
            <JumpToColumn propagateState={propagateStateSpy} />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => {
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    serverStateSpy = jest.spyOn(serverState, 'updateVisibility');
    serverStateSpy.mockImplementation(() => undefined);
  });

  afterEach(jest.restoreAllMocks);

  it('JumpToColumn rendering columns', async () => {
    await updateProps();
    const columnSelect = document.body.getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(columnSelect);
    });
    await selectOption(columnSelect, 'foo');
    expect(serverStateSpy).toHaveBeenCalledWith('1', { bar: false, col: true, foo: true });
    expect(propagateStateSpy).toHaveBeenCalledWith(expect.objectContaining({ refresh: true, triggerResize: true }));
  });
});
