import { ReactWrapper } from 'enzyme';
import { Modal } from 'react-bootstrap';
import { act } from 'react-dom/test-utils';
import Dropzone, { DropEvent } from 'react-dropzone';

import CSVOptions from '../../../popups/upload/CSVOptions';
import SheetSelector from '../../../popups/upload/SheetSelector';
import Upload from '../../../popups/upload/Upload';
import { RemovableError } from '../../../RemovableError';

import * as TestSupport from './Upload.test.support';

describe('Upload', () => {
  const { close, location, open, opener } = window;
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    delete (window as any).location;
    delete (window as any).close;
    delete (window as any).open;
    delete window.opener;
    (window as any).location = {
      reload: jest.fn(),
      pathname: '/dtale/column/1',
      href: '',
      assign: jest.fn(),
    };
    window.close = jest.fn();
    window.open = jest.fn();
    window.opener = { location: { assign: jest.fn(), pathname: '/dtale/column/1' } };
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    spies.afterAll();
    window.location = location;
    window.close = close;
    window.open = open;
    window.opener = opener;
  });

  const upload = (): ReactWrapper => result.find(Upload).first();

  const fireUpload = async (filename = 'test.csv'): Promise<ReactWrapper> => {
    const mFile = new File(['test'], filename);
    await act(async () => {
      upload()
        .find(Dropzone)
        .props()
        .onDrop?.([mFile], [], {} as DropEvent);
    });
    return result.update();
  };

  it('renders successfully', async () => {
    expect(upload()).toHaveLength(1);
  });

  it('handles upload', async () => {
    result = await fireUpload();
    expect(result.find(CSVOptions).props().show).toBe(true);
    await act(async () => {
      result.find(CSVOptions).find('button').last().simulate('click');
    });
    result = result.update();
    expect(spies.uploadSpy).toHaveBeenCalledTimes(1);
    const [firstData] = spies.uploadSpy.mock.calls[0];
    const read = new FileReader();
    read.readAsBinaryString((firstData as any).entries().next().value[1]);
    read.onloadend = (): void => {
      expect(read.result).toBe('data:application/octet-stream;base64,dGVzdA==');
    };
    expect((firstData as any).entries().next().value[0]).toBe('test.csv');
    expect(window.location.assign).toBeCalledWith('/2');
  });

  it('handles upload error', async () => {
    spies.uploadSpy.mockResolvedValue({
      success: false,
      error: 'error test',
    });
    result = await fireUpload('test.parquet');
    expect(result.find(RemovableError).props().error).toBe('error test');
  });

  it('DataViewer: upload window', async () => {
    window.location.pathname = '/dtale/popup/upload';
    result = await fireUpload();
    await act(async () => {
      result.find(CSVOptions).find('i.ico-check-box').simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find(CSVOptions).find('button').at(4).simulate('click');
    });
    result = result.update();
    await act(async () => {
      result
        .find(CSVOptions)
        .find('input')
        .simulate('change', { target: { value: '=' } });
    });
    result = result.update();
    await act(async () => {
      result.find(CSVOptions).find('button').last().simulate('click');
    });
    result = result.update();

    expect(spies.uploadSpy).toHaveBeenCalledTimes(1);
    const [firstData] = spies.uploadSpy.mock.calls[0];
    expect(firstData.get('header')).toBe('false');
    expect(firstData.get('separatorType')).toBe('custom');
    expect(firstData.get('separator')).toBe('=');
    expect(window.close).toBeCalledTimes(1);
    expect(window.opener.location.assign).toBeCalledWith('/2');
  });

  it('DataViewer: cancel CSV upload', async () => {
    window.location.pathname = '/dtale/popup/upload';
    result = await fireUpload();
    await act(async () => {
      result.find(CSVOptions).find('button').at(5).simulate('click');
    });
    result = result.update();

    expect(spies.uploadSpy).not.toHaveBeenCalled();
    expect(result.find(CSVOptions).props().show).toBe(false);
  });

  it('DataViewer: upload from web', async () => {
    await act(async () => {
      upload().find('div.form-group').first().find('button').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      upload()
        .find('div.form-group')
        .at(1)
        .find('input')
        .simulate('change', { target: { value: 'http://test' } });
    });
    result = result.update();
    await act(async () => {
      upload()
        .find('div.form-group')
        .at(2)
        .find('input')
        .simulate('change', { target: { value: 'http://test' } });
    });
    result = result.update();
    await act(async () => {
      upload().find('div.row').at(1).find('button').first().simulate('click');
    });
    result = result.update();
    expect(window.location.assign).toBeCalledWith('/2');
  });

  it('DataViewer: upload dataset', async () => {
    await act(async () => {
      upload().find('div.form-group').last().find('button').first().simulate('click');
    });
    result = result.update();
    expect(window.location.assign).toBeCalledWith('/2');
  });

  describe('web excel uploads', () => {
    beforeEach(() => {
      spies.webUploadSpy.mockResolvedValue({
        success: true,
        sheets: [
          { name: 'Sheet 1', dataId: 1 },
          { name: 'Sheet 2', dataId: 2 },
        ],
      });
    });

    it('DataViewer: upload from excel web', async () => {
      await act(async () => {
        upload().find('div.form-group').first().find('button').last().simulate('click');
      });
      result = result.update();
      await act(async () => {
        upload()
          .find('div.form-group')
          .at(1)
          .find('input')
          .simulate('change', { target: { value: 'http://test' } });
      });
      result = result.update();
      await act(async () => {
        upload()
          .find('div.form-group')
          .at(2)
          .find('input')
          .simulate('change', { target: { value: 'http://test' } });
      });
      result = result.update();
      await act(async () => {
        upload().find('div.row').at(1).find('button').first().simulate('click');
      });
      result = result.update();
      const sheetSelector = result.find(SheetSelector).find(Modal).first();
      expect(sheetSelector.props().show).toBe(true);
      expect(sheetSelector.find('Resizable').find(Modal.Body).text()).toEqual('Sheet 1Sheet 2');
    });
  });
});
