import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';

import SheetSelector from '../../../popups/upload/SheetSelector';
import * as uploadUtils from '../../../popups/upload/uploadUtils';
import * as InstanceRepository from '../../../repository/InstanceRepository';

describe('SheetSelector', () => {
  const setSheets = jest.fn();
  let jumpToDatasetSpy: jest.SpyInstance;
  let cleanupInstancesSpy: jest.SpyInstance;

  beforeEach(async () => {
    cleanupInstancesSpy = jest.spyOn(InstanceRepository, 'cleanupInstances');
    cleanupInstancesSpy.mockResolvedValue({ success: true });
    jumpToDatasetSpy = jest.spyOn(uploadUtils, 'jumpToDataset');
    jumpToDatasetSpy.mockImplementation(() => Promise.resolve(undefined));
    await act(
      async () =>
        await render(
          <SheetSelector
            setSheets={setSheets}
            sheets={[
              { name: 'Sheet 1', dataId: 1, selected: true },
              { name: 'Sheet 2', dataId: 2, selected: true },
            ]}
          />,
        ).container,
    );
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('calls jumpToDataset without clearing data', async () => {
    await act(async () => {
      await fireEvent.click(screen.getByText('Load Sheets'));
    });
    expect(jumpToDatasetSpy.mock.calls[0][0]).toBe('1');
  });

  it('calls jumpToDataset with clearing data', async () => {
    await act(async () => {
      await fireEvent.click(screen.getByTestId('sheet-selector').querySelector('i.ico-check-box')!);
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Load Sheets'));
    });
    expect(jumpToDatasetSpy.mock.calls[0][0]).toBe('2');
    expect(cleanupInstancesSpy).toHaveBeenCalledWith(['1']);
  });

  it('propagates state to clear sheets', async () => {
    await act(async () => {
      await fireEvent.click(screen.getByText('Clear Sheets'));
    });
    expect(setSheets).toBeCalledWith([]);
  });
});
