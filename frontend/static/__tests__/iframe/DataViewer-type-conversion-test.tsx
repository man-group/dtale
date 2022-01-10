import axios from 'axios';
import { mount } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { DataViewer } from '../../dtale/DataViewer';
import CreateColumn from '../../popups/create/CreateColumn';
import { CreateColumnSaveParams, CreateColumnType, SaveAs } from '../../popups/create/CreateColumnState';
import CreateTypeConversion from '../../popups/create/CreateTypeConversion';
import * as CreateColumnRepository from '../../repository/CreateColumnRepository';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../test-utils';

import { clickColMenuButton, openColMenu } from './iframe-utils';

describe('DataViewer iframe tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });
  let saveSpy: jest.SpyInstance<
    Promise<CreateColumnRepository.SaveResponse | undefined>,
    [dataId: string, params: CreateColumnSaveParams, route?: string]
  >;

  beforeAll(() => {
    dimensions.beforeAll();
    // mockChartJS();
  });

  beforeEach(() => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    saveSpy = jest.spyOn(CreateColumnRepository, 'save');
    saveSpy.mockResolvedValue({ success: true });
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it('DataViewer: renaming a column', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', iframe: 'True' }, store);
    let result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );

    await tickUpdate(result);
    await openColMenu(result, 2);
    await clickColMenuButton(result, 'Type Conversion');
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
});
