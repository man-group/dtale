import { act, render } from '@testing-library/react';
import * as React from 'react';

import { ColumnDef } from '../../../dtale/DataViewerState';
import { ColumnNavigation, ColumnNavigationProps } from '../../../popups/describe/ColumnNavigation';
import reduxUtils from '../../redux-test-utils';

describe('ColumnNavigation', () => {
  let props: ColumnNavigationProps;
  let addEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    props = {
      dtypes: reduxUtils.DTYPES.dtypes as ColumnDef[],
      selectedIndex: (reduxUtils.DTYPES.dtypes[1] as ColumnDef).index,
      setSelected: jest.fn(),
    };
    render(<ColumnNavigation {...props} />);
  });

  const buildMock = (overrides?: Partial<ColumnNavigationProps>): void => {
    props = {
      dtypes: reduxUtils.DTYPES.dtypes as ColumnDef[],
      selectedIndex: (reduxUtils.DTYPES.dtypes[1] as ColumnDef).index,
      setSelected: jest.fn(),
      ...overrides,
    };
    render(<ColumnNavigation {...props} />);
  };

  afterEach(jest.restoreAllMocks);

  const move = async (prop: string): Promise<void> => {
    await act(async () => {
      addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1]({
        key: prop,
        stopPropagation: jest.fn(),
      });
    });
  };

  it('moves selected index up on UP', async () => {
    buildMock();
    await move('ArrowUp');
    expect(props.setSelected).toHaveBeenCalledWith(reduxUtils.DTYPES.dtypes[0]);
  });

  it('moves selected index down on DOWN', async () => {
    buildMock();
    await move('ArrowDown');
    expect(props.setSelected).toHaveBeenCalledWith(reduxUtils.DTYPES.dtypes[2]);
  });

  it('does nothing on DOWN if at last column', async () => {
    buildMock({
      selectedIndex: reduxUtils.DTYPES.dtypes[reduxUtils.DTYPES.dtypes.length - 1].index,
    });
    await move('ArrowDown');
    expect(props.setSelected).not.toHaveBeenCalled();
  });

  it('does nothing on UP if at first column', async () => {
    buildMock({ selectedIndex: reduxUtils.DTYPES.dtypes[0].index });
    await move('ArrowUp');
    expect(props.setSelected).not.toHaveBeenCalled();
  });
});
