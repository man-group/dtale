import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import SheetSelector from '../../../popups/upload/SheetSelector';
import * as uploadUtils from '../../../popups/upload/uploadUtils';
import * as InstanceRepository from '../../../repository/InstanceRepository';
import { tickUpdate } from '../../test-utils';

describe('SheetSelector', () => {
  let result: ReactWrapper;
  const setSheets = jest.fn();
  let jumpToDatasetSpy: jest.SpyInstance;
  let cleanupInstancesSpy: jest.SpyInstance;

  beforeEach(async () => {
    cleanupInstancesSpy = jest.spyOn(InstanceRepository, 'cleanupInstances');
    cleanupInstancesSpy.mockResolvedValue({ success: true });
    jumpToDatasetSpy = jest.spyOn(uploadUtils, 'jumpToDataset');
    jumpToDatasetSpy.mockImplementation(() => Promise.resolve(undefined));
    result = mount(
      <SheetSelector
        setSheets={setSheets}
        sheets={[
          { name: 'Sheet 1', dataId: 1, selected: true },
          { name: 'Sheet 2', dataId: 2, selected: true },
        ]}
      />,
    );
    await act(async () => tickUpdate(result));
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('calls jumpToDataset without clearing data', async () => {
    result.find('button').last().simulate('click');
    expect(jumpToDatasetSpy.mock.calls[0][0]).toBe('1');
  });

  it('calls jumpToDataset with clearing data', async () => {
    await act(async () => {
      result.find('Resizable').find('i.ico-check-box').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find('button').last().simulate('click');
    });
    result = result.update();
    expect(jumpToDatasetSpy.mock.calls[0][0]).toBe('2');
    expect(cleanupInstancesSpy).toHaveBeenCalledWith(['1']);
  });

  it('propagates state to clear sheets', async () => {
    await act(async () => {
      result.find('button').first().simulate('click');
    });
    result = result.update();
    expect(setSheets).toBeCalledWith([]);
  });
});
