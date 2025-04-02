import { act, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import Upload from '../../../popups/upload/Upload';
import { Dataset, DataType } from '../../../popups/upload/UploadState';
import * as UploadRepository from '../../../repository/UploadRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

/** Bundles alot of jest setup for CreateColumn component tests */
export class Spies {
  public uploadSpy: jest.SpyInstance<Promise<UploadRepository.UploadResponse | undefined>, [params: FormData]>;
  public webUploadSpy: jest.SpyInstance<
    Promise<UploadRepository.UploadResponse | undefined>,
    [type: DataType, url: string, proxy?: string]
  >;
  public presetUploadSpy: jest.SpyInstance<Promise<UploadRepository.UploadResponse | undefined>, [dataset: Dataset]>;
  public readAsDataURLSpy: jest.SpyInstance;
  public btoaSpy: jest.SpyInstance;
  public store: Store;

  /** Initializes all spy instances */
  constructor() {
    this.uploadSpy = jest.spyOn(UploadRepository, 'upload');
    this.webUploadSpy = jest.spyOn(UploadRepository, 'webUpload');
    this.presetUploadSpy = jest.spyOn(UploadRepository, 'presetUpload');
    this.readAsDataURLSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL');
    this.btoaSpy = jest.spyOn(window, 'btoa');
    this.store = reduxUtils.createDtaleStore();
  }

  /** Sets the mockImplementation/mockReturnValue for spy instances */
  public setupMockImplementations(): void {
    (axios.get as any).mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    this.uploadSpy.mockResolvedValue({ success: true, data_id: '2' });
    this.webUploadSpy.mockResolvedValue({ success: true, data_id: '2' });
    this.presetUploadSpy.mockResolvedValue({ success: true, data_id: '2' });
  }

  /** Cleanup after each jest tests */
  public afterEach(): void {
    jest.resetAllMocks();
  }

  /** Cleanup after all jest tests */
  public afterAll(): void {
    jest.restoreAllMocks();
  }

  /**
   * Build the initial wrapper.
   *
   * @param overrides redux overrides
   * @return the wrapper for testing.
   */
  public async setupWrapper(overrides?: Record<string, string>): Promise<Element> {
    this.store = reduxUtils.createDtaleStore();
    buildInnerHTML({ enableWebUploads: 'True', ...overrides }, this.store);
    return await act((): Element => {
      const { container } = render(
        <Provider store={this.store}>
          <Upload />
        </Provider>,
        {
          container: document.getElementById('content') ?? undefined,
        },
      );
      return container;
    });
  }
}
