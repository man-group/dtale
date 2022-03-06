import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import Upload from '../../../popups/upload/Upload';
import { Dataset, DataType } from '../../../popups/upload/UploadState';
import * as UploadRepository from '../../../repository/UploadRepository';
import reduxUtils from '../../redux-test-utils';
import { tickUpdate } from '../../test-utils';

/** Bundles alot of jest setup for CreateColumn component tests */
export class Spies {
  public uploadSpy: jest.SpyInstance<Promise<UploadRepository.UploadResponse | undefined>, [params: FormData]>;
  public webUploadSpy: jest.SpyInstance<
    Promise<UploadRepository.UploadResponse | undefined>,
    [type: DataType, url: string, proxy?: string]
  >;
  public presetUploadSpy: jest.SpyInstance<Promise<UploadRepository.UploadResponse | undefined>, [dataset: Dataset]>;
  public axiosGetSpy: jest.SpyInstance;
  public readAsDataURLSpy: jest.SpyInstance;
  public btoaSpy: jest.SpyInstance;

  /** Initializes all spy instances */
  constructor() {
    this.uploadSpy = jest.spyOn(UploadRepository, 'upload');
    this.webUploadSpy = jest.spyOn(UploadRepository, 'webUpload');
    this.presetUploadSpy = jest.spyOn(UploadRepository, 'presetUpload');
    this.axiosGetSpy = jest.spyOn(axios, 'get');
    this.readAsDataURLSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL');
    this.btoaSpy = jest.spyOn(window, 'btoa');
  }

  /** Sets the mockImplementation/mockReturnValue for spy instances */
  public setupMockImplementations(): void {
    this.axiosGetSpy.mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
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
   * Build the initial enzyme wrapper.
   *
   * @return the enzyme wrapper for testing.
   */
  public async setupWrapper(): Promise<ReactWrapper> {
    const result = mount(<Upload />);
    await act(async () => await tickUpdate(result));
    return result.update();
  }
}
