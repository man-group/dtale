import { mount, shallow } from 'enzyme';
import React from 'react';
import { Provider } from 'react-redux';

import * as serverState from '../../../dtale/serverStateManagement';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tick } from '../../test-utils';

describe('DataViewerInfo tests', () => {
  let EditedCellInfo, ReactEditedCellInfo, store, props;

  beforeEach(() => {
    store = reduxUtils.createDtaleStore();
    const components = require('../../../dtale/edited/EditedCellInfo');
    EditedCellInfo = components.EditedCellInfo;
    ReactEditedCellInfo = components.ReactEditedCellInfo;
    buildInnerHTML({ settings: '' }, store);
    document.getElementsByTagName('body')[0].innerHTML += `<span id="text-measure" />`;
  });

  afterEach(jest.restoreAllMocks);

  const buildInfo = (additionalProps, editedCell) => {
    const columns = [{ name: 'a', dtype: 'string', index: 1, visible: true }];
    const data = { 0: { a: { raw: 'Hello World' } } };
    props = {
      propagateState: jest.fn(),
      gridState: { data, columns },
      ...additionalProps,
    };
    if (editedCell) {
      store.getState().editedCell = editedCell;
    }
    return mount(
      <Provider store={store}>
        <EditedCellInfo {...props} />
      </Provider>,
      { attachTo: document.getElementById('content') },
    );
  };

  it('EditedCellInfo renders successfully', () => {
    const result = buildInfo({});
    expect(result.find('div.edited-cell-info')).toHaveLength(1);
  });

  it('EditedCellInfo renders edited data', () => {
    const result = buildInfo({}, '0|1');
    expect(result.find('textarea').props().value).toBe('Hello World');
  });

  it('EditedCellInfo handles updates', async () => {
    const shallowProps = {
      ...props,
      openChart: jest.fn(),
      clearEdit: jest.fn(),
      updateHeight: jest.fn(),
    };
    jest.spyOn(React, 'createRef').mockReturnValueOnce({ current: document.createElement('textarea') });
    const editCellSpy = jest.spyOn(serverState, 'editCell');
    editCellSpy.mockResolvedValue(Promise.resolve({ success: true }));
    const wrapper = shallow(<ReactEditedCellInfo {...shallowProps} />);
    wrapper.setProps({ editedCell: '0|1' });
    expect(wrapper.find('textarea').props().value).toBe('Hello World');
    expect(shallowProps.updateHeight).toHaveBeenCalled();

    await wrapper.instance().onKeyDown({ key: 'Enter' });
    expect(shallowProps.clearEdit).toHaveBeenCalledTimes(1);
    wrapper.setState({ value: 'Hello World2' });
    await wrapper.instance().onKeyDown({ key: 'Enter' });
    expect(editCellSpy).toHaveBeenCalledTimes(1);
  });

  it('handles save errors', async () => {
    const editCellSpy = jest.spyOn(serverState, 'editCell');
    editCellSpy.mockResolvedValue(Promise.resolve({ error: 'bad value' }));
    const result = buildInfo({}, '0|1');
    expect(result.find('textarea').props().value).toBe('Hello World');

    result.find('textarea').simulate('change', { target: { value: 'Hello World2' } });
    expect(result.find(ReactEditedCellInfo).state().value).toBe('Hello World2');
    await result.find('textarea').simulate('keyDown', { key: 'Enter' });
    await tick();
    expect(store.getState().chartData).toEqual({
      visible: true,
      error: 'bad value',
      type: 'error',
    });
  });
});
