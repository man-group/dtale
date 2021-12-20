import { mount } from 'enzyme';
import React from 'react';
import { Provider } from 'react-redux';

import DimensionsHelper from '../DimensionsHelper';
import mockPopsicle from '../MockPopsicle';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS, tick, tickUpdate } from '../test-utils';
import { clickColMenuButton, openColMenu } from './iframe-utils';

describe('DataViewer iframe tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    mockPopsicle();
  });

  afterAll(() => dimensions.afterAll());

  it('DataViewer: renaming a column', async () => {
    const fetcher = require('../../fetcher');
    const postSpy = jest.spyOn(fetcher, 'fetchPost');
    const { DataViewer } = require('../../dtale/DataViewer');
    const CreateColumn = require('../../popups/create/CreateColumn').ReactCreateColumn;
    const CreateTypeConversion = require('../../popups/create/CreateTypeConversion').default;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', iframe: 'True' }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content'),
      },
    );

    await tickUpdate(result);
    await openColMenu(result, 2);
    await clickColMenuButton(result, 'Type Conversion');
    await tickUpdate(result);
    result.find(CreateTypeConversion).find('div.form-group').first().find('button').at(2).simulate('click');
    result.update();
    result.find(CreateColumn).find('div.modal-footer').find('button').first().simulate('click');
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: 'col3',
      fmt: null,
      unit: null,
      to: 'float',
      from: 'object',
      applyAllType: false,
    });
    postSpy.mockRestore();
  });
});
