import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';

import { ColumnDef } from '../../../dtale/DataViewerState';
import { ColumnNavigation, ColumnNavigationProps } from '../../../popups/describe/ColumnNavigation';
import reduxUtils from '../../redux-test-utils';

describe('ColumnNavigation', () => {
  let wrapper: ShallowWrapper;
  let props: ColumnNavigationProps;

  beforeEach(() => {
    props = {
      dtypes: reduxUtils.DTYPES.dtypes as ColumnDef[],
      selected: reduxUtils.DTYPES.dtypes[1] as ColumnDef,
      propagateState: jest.fn(),
    };
    wrapper = shallow(<ColumnNavigation {...props} />);
  });

  afterEach(jest.restoreAllMocks);

  const move = (prop: string): void => wrapper.find(GlobalHotKeys).props().handlers[prop]();

  it('moves selected index up on UP', () => {
    move('COL_UP');
    expect(props.propagateState).toHaveBeenCalledWith({
      selected: reduxUtils.DTYPES.dtypes[2],
    });
  });

  it('moves selected index down on DOWN', () => {
    move('COL_DOWN');
    expect(props.propagateState).toHaveBeenCalledWith({
      selected: reduxUtils.DTYPES.dtypes[0],
    });
  });

  it('does nothing on UP if at last column', () => {
    wrapper.setProps({
      selected: reduxUtils.DTYPES.dtypes[reduxUtils.DTYPES.dtypes.length - 1],
    });
    move('COL_UP');
    expect(props.propagateState).not.toHaveBeenCalled();
  });

  it('does nothing on DOWN if at first column', () => {
    wrapper.setProps({ selected: reduxUtils.DTYPES.dtypes[0] });
    move('COL_DOWN');
    expect(props.propagateState).not.toHaveBeenCalled();
  });
});
