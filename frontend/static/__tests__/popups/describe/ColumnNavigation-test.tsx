import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import { ColumnDef } from '../../../dtale/DataViewerState';
import { ColumnNavigation, ColumnNavigationProps } from '../../../popups/describe/ColumnNavigation';
import reduxUtils from '../../redux-test-utils';

describe('ColumnNavigation', () => {
  let wrapper: ReactWrapper;
  let props: ColumnNavigationProps;
  let addEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    props = {
      dtypes: reduxUtils.DTYPES.dtypes as ColumnDef[],
      selectedIndex: (reduxUtils.DTYPES.dtypes[1] as ColumnDef).index,
      setSelected: jest.fn(),
    };
    wrapper = mount(<ColumnNavigation {...props} />);
  });

  afterEach(jest.restoreAllMocks);

  const move = async (prop: string): Promise<ReactWrapper> => {
    await act(async () => {
      addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1]({
        key: prop,
        stopPropagation: jest.fn(),
      });
    });
    return wrapper.update();
  };

  it('moves selected index up on UP', async () => {
    wrapper = await move('ArrowUp');
    expect(props.setSelected).toHaveBeenCalledWith(reduxUtils.DTYPES.dtypes[0]);
  });

  it('moves selected index down on DOWN', async () => {
    wrapper = await move('ArrowDown');
    expect(props.setSelected).toHaveBeenCalledWith(reduxUtils.DTYPES.dtypes[2]);
  });

  it('does nothing on DOWN if at last column', async () => {
    wrapper.setProps({
      selectedIndex: reduxUtils.DTYPES.dtypes[reduxUtils.DTYPES.dtypes.length - 1].index,
    });
    wrapper = await move('ArrowDown');
    expect(props.setSelected).not.toHaveBeenCalled();
  });

  it('does nothing on UP if at first column', async () => {
    wrapper.setProps({ selectedIndex: reduxUtils.DTYPES.dtypes[0].index });
    wrapper = await move('ArrowUp');
    expect(props.setSelected).not.toHaveBeenCalled();
  });
});
