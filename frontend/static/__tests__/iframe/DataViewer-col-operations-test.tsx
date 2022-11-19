import { act, fireEvent, getByRole, getByText, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import { CreateColumnType, SaveAs } from '../../popups/create/CreateColumnState';
import * as CreateColumnRepository from '../../repository/CreateColumnRepository';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML } from '../test-utils';

import {
  clickColMenuButton,
  clickColMenuSubButton,
  findColMenuButton,
  openColMenu,
  validateHeaders,
} from './iframe-utils';

describe('Column operations in an iframe', () => {
  let result: Element;
  let store: Store;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => dimensions.beforeAll());

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    (axios.post as any).mockResolvedValue(Promise.resolve({ data: undefined }));
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', iframe: 'True' }, store);
    result = await act(
      () =>
        render(
          <Provider store={store}>
            <DataViewer />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  const executeConfirm = async (): Promise<void> => {
    await act(async () => {
      await fireEvent.click(document.body.querySelector('div.modal-footer')!.getElementsByTagName('button')[0]);
    });
  };

  it('deletes a column', async () => {
    await openColMenu(3);
    await clickColMenuButton('Delete');
    await executeConfirm();
    validateHeaders(['col1', 'col2', 'col3']);
  });

  it('sorts columns', async () => {
    await openColMenu(3);
    await clickColMenuSubButton('Asc');
    expect(result.querySelector('div.row div.col')!.textContent).toBe('Sort:col4 (ASC)');
    await openColMenu(3);
    await clickColMenuSubButton('Desc');
    expect(result.querySelector('div.row div.col')!.textContent).toBe('Sort:col4 (DESC)');
    await openColMenu(3);
    await clickColMenuSubButton('None');
    validateHeaders(['col1', 'col2', 'col3', 'col4']);
  });

  it('toggles heatmap', async () => {
    await openColMenu(1);
    await clickColMenuButton('Heat Map');
    validateHeaders(['col1', 'col2', 'col3', 'col4']);
    expect(store.getState().settings.backgroundMode).toBe('heatmap-col-col2');
    await openColMenu(1);
    await clickColMenuButton('Heat Map');
    expect(store.getState().settings.backgroundMode).toBeUndefined();
    await openColMenu(3);
    expect(findColMenuButton('Heat Map')).toBeUndefined();
  });

  it('convert type of a column', async () => {
    const saveSpy = jest.spyOn(CreateColumnRepository, 'save');
    saveSpy.mockResolvedValue({ success: true });
    await openColMenu(2);
    await clickColMenuButton('Type Conversion');
    await act(async () => {
      await fireEvent.click(getByText(document.body, 'Float'));
    });
    await executeConfirm();
    expect(saveSpy).toHaveBeenLastCalledWith(
      '1',
      {
        cfg: {
          col: 'col3',
          to: 'float',
          from: 'object',
          applyAllType: false,
          fmt: undefined,
          unit: undefined,
        },
        saveAs: SaveAs.INPLACE,
        type: CreateColumnType.TYPE_CONVERSION,
      },
      'build-column',
    );
  });

  it('renames a column', async () => {
    await openColMenu(3);
    await clickColMenuButton('Rename');
    const renameBody = document.body.querySelector('div.modal-body')!;
    await act(async () => {
      await fireEvent.change(renameBody.getElementsByTagName('input')[0], { target: { value: 'col2' } });
    });
    expect(getByRole(document.body, 'alert')).toBeDefined();
    await act(async () => {
      await fireEvent.change(renameBody.getElementsByTagName('input')[0], { target: { value: 'col5' } });
    });
    await executeConfirm();
    validateHeaders(['col1', 'col2', 'col3', 'col5']);
  });
});
