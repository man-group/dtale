import { mount } from 'enzyme';
import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Dropzone from 'react-dropzone';
import { Provider } from 'react-redux';

import { RemovableError } from '../../RemovableError';
import CSVOptions from '../../popups/upload/CSVOptions';
import DimensionsHelper from '../DimensionsHelper';
import mockPopsicle from '../MockPopsicle';
import reduxUtils from '../redux-test-utils';

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  const { close, location, open, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });
  let result, DataViewer, Upload;
  let readAsDataURLSpy, btoaSpy, postSpy;

  beforeAll(() => {
    dimensions.beforeAll();
    delete window.location;
    delete window.close;
    delete window.open;
    delete window.opener;
    window.location = {
      reload: jest.fn(),
      pathname: '/dtale/column/1',
      assign: jest.fn(),
    };
    window.close = jest.fn();
    window.open = jest.fn();
    window.opener = { location: { assign: jest.fn() } };

    mockPopsicle();
    mockChartJS();

    DataViewer = require('../../dtale/DataViewer').DataViewer;
    Upload = require('../../popups/upload/Upload').ReactUpload;
  });

  beforeEach(async () => {
    readAsDataURLSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL');
    btoaSpy = jest.spyOn(window, 'btoa');
    const fetcher = require('../../fetcher');
    postSpy = jest.spyOn(fetcher, 'fetchPost');
    postSpy.mockImplementation((_url, _data, success) => success({ data_id: '2' }));
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById('content') },
    );
    await tick();
    await clickMainMenuButton(result, 'Load Data');
    await tickUpdate(result);
  });

  afterEach(() => {
    result.unmount();
    readAsDataURLSpy.mockRestore();
    btoaSpy.mockRestore();
    postSpy.mockRestore();
  });

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.close = close;
    window.open = open;
    window.opener = opener;
  });

  const upload = () => result.find(Upload).first();

  it('DataViewer: upload open/close', async () => {
    expect(result.find(Upload).length).toBe(1);
    result.find(Modal.Header).first().find('button').simulate('click');
    expect(result.find(Upload).length).toBe(0);
  });

  it('DataViewer: upload', async () => {
    const mFile = new File(['test'], 'test.csv');
    const uploadModal = upload();
    const dd = uploadModal.find(Dropzone);
    dd.props().onDrop([mFile]);
    await tickUpdate(result);
    await tickUpdate(result);

    expect(result.find(CSVOptions).props().show).toBe(true);
    result.find(CSVOptions).find('button').last().simulate('click');
    await tickUpdate(result);

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [firstUrl, firstData, firstSuccess] = postSpy.mock.calls[0];
    expect(firstUrl).toBe('/dtale/upload');
    const read = new FileReader();
    read.readAsBinaryString(firstData.entries().next().value[1]);
    read.onloadend = function () {
      expect(read.result).toBe('data:application/octet-stream;base64,dGVzdA==');
    };
    expect(firstData.entries().next().value[0]).toBe('test.csv');
    expect(window.location.assign).toBeCalledWith('/2');

    firstSuccess({ error: 'error test' });
    result.update();
    expect(result.find(RemovableError)).toHaveLength(1);
    await tick();
  });

  it('DataViewer: upload window', async () => {
    window.location.pathname = '/dtale/popup/upload';
    const mFile = new File(['test'], 'test.csv');
    const uploadModal = upload();
    const dd = uploadModal.find(Dropzone);
    dd.props().onDrop([mFile]);
    await tickUpdate(result);
    await tickUpdate(result);
    result.find(CSVOptions).find('i.ico-check-box').simulate('click');
    result.find(CSVOptions).find('button').at(4).simulate('click');
    result
      .find(CSVOptions)
      .find('input')
      .simulate('change', { target: { value: '=' } });
    result.find(CSVOptions).find('button').last().simulate('click');
    await tickUpdate(result);

    expect(postSpy).toHaveBeenCalledTimes(1);
    const firstData = postSpy.mock.calls[0][1];
    expect(firstData.get('header')).toBe('false');
    expect(firstData.get('separatorType')).toBe('custom');
    expect(firstData.get('separator')).toBe('=');
    expect(window.close).toBeCalledTimes(1);
    expect(window.opener.location.assign).toBeCalledWith('/2');
    await tick();
  });

  it('DataViewer: cancel CSV upload', async () => {
    window.location.pathname = '/dtale/popup/upload';
    const mFile = new File(['test'], 'test.csv');
    const uploadModal = upload();
    const dd = uploadModal.find(Dropzone);
    dd.props().onDrop([mFile]);
    await tickUpdate(result);
    await tickUpdate(result);
    result.find(CSVOptions).find('button').at(5).simulate('click');
    await tickUpdate(result);

    expect(postSpy).not.toHaveBeenCalled();
    expect(result.find(CSVOptions).props().show).toBe(false);
    await tick();
  });
});
