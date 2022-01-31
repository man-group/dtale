import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { DataViewer, ReactDataViewer } from '../../dtale/DataViewer';
import * as fetcher from '../../fetcher';
import Confirmation from '../../popups/Confirmation';
import CreateColumn from '../../popups/create/CreateColumn';
import { CreateColumnType, SaveAs } from '../../popups/create/CreateColumnState';
import CreateTypeConversion from '../../popups/create/CreateTypeConversion';
import { Rename } from '../../popups/Rename';
import { RemovableError } from '../../RemovableError';
import * as CreateColumnRepository from '../../repository/CreateColumnRepository';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../test-utils';

import {
  clickColMenuButton,
  clickColMenuSubButton,
  findColMenuButton,
  openColMenu,
  validateHeaders,
} from './iframe-utils';

describe('Column operations in an iframe', () => {
  let result: ReactWrapper;
  let postSpy: jest.SpyInstance;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => dimensions.beforeAll());

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    postSpy = jest.spyOn(fetcher, 'fetchPost');
    postSpy.mockImplementation((_url, _params, callback) => callback());
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', iframe: 'True' }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await tickUpdate(result);
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  const executeConfirm = async (): Promise<ReactWrapper> => {
    await act(async () => {
      result.find(Confirmation).find('div.modal-footer').find('button').first().simulate('click');
    });
    return result.update();
  };

  it('deletes a column', async () => {
    result = await openColMenu(result, 3);
    result = await clickColMenuButton(result, 'Delete');
    result = await executeConfirm();
    validateHeaders(result, ['col1', 'col2', 'col3']);
  });

  it('sorts columns', async () => {
    result = await openColMenu(result, 3);
    result = await clickColMenuSubButton(result, 'Asc');
    expect(result.find('div.row div.col').first().text()).toBe('Sort:col4 (ASC)');
    result = await clickColMenuSubButton(result, 'Desc');
    expect(result.find('div.row div.col').first().text()).toBe('Sort:col4 (DESC)');
    result = await clickColMenuSubButton(result, 'None');
    validateHeaders(result, ['col1', 'col2', 'col3', 'col4']);
  });

  it('toggles heatmap', async () => {
    result = await openColMenu(result, 1);
    result = await clickColMenuButton(result, 'Heat Map');
    validateHeaders(result, ['col1', 'col2', 'col3', 'col4']);
    expect(result.find(ReactDataViewer).instance().state.backgroundMode).toBe('heatmap-col-col2');
    result = await openColMenu(result, 1);
    result = await clickColMenuButton(result, 'Heat Map');
    expect(result.find(ReactDataViewer).instance().state.backgroundMode).toBeUndefined();
    result = await openColMenu(result, 3);
    expect(findColMenuButton(result, 'Heat Map')).toHaveLength(0);
  });

  it('convert type of a column', async () => {
    const saveSpy = jest.spyOn(CreateColumnRepository, 'save');
    saveSpy.mockResolvedValue({ success: true });
    result = await openColMenu(result, 2);
    result = await clickColMenuButton(result, 'Type Conversion');
    await act(async () => {
      result.find(CreateTypeConversion).find('div.form-group').first().find('button').at(2).simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find(CreateColumn).find('div.modal-footer').find('button').first().simulate('click');
    });
    result = result.update();
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
    result = await openColMenu(result, 3);
    result = await clickColMenuButton(result, 'Rename');
    await act(async () => {
      result
        .find(Rename)
        .find('div.modal-body')
        .find('input')
        .first()
        .simulate('change', { target: { value: 'col2' } });
    });
    result = result.update();
    expect(result.find(Rename).find(RemovableError).length).toBeGreaterThan(0);
    await act(async () => {
      result
        .find(Rename)
        .find('div.modal-body')
        .find('input')
        .first()
        .simulate('change', { target: { value: 'col5' } });
    });
    result = result.update();
    await act(async () => {
      result.find(Rename).find('div.modal-footer').find('button').first().simulate('click');
    });
    result = result.update();
    validateHeaders(result, ['col1', 'col2', 'col3', 'col5']);
  });
});
