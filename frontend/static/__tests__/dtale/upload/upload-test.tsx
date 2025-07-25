import { act, fireEvent, getByTestId, screen } from '@testing-library/react';

import * as windowUtils from '../../../location';

import * as TestSupport from './Upload.test.support';

describe('Upload', () => {
  const { close, location, open, opener } = window;
  const spies = new TestSupport.Spies();
  const reloadSpy = jest.fn();
  const assignSpy = jest.fn();
  const openerAssignSpy = jest.fn();

  beforeEach(async () => {
    delete (window as any).location;
    delete (window as any).close;
    delete (window as any).open;
    delete window.opener;
    jest.spyOn(windowUtils, 'getLocation').mockReturnValue({
      reload: reloadSpy,
      pathname: '/dtale/column/1',
      href: '',
      assign: assignSpy,
    } as any);
    window.close = jest.fn();
    window.open = jest.fn();
    window.opener = { location: {} };
    jest.spyOn(windowUtils, 'getOpenerLocation').mockReturnValue({
      assign: openerAssignSpy,
      pathname: '/dtale/column/1',
    } as any);
    spies.setupMockImplementations();
    await spies.setupWrapper();
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    spies.afterAll();
    window.location = location as any;
    window.close = close;
    window.open = open;
    window.opener = opener;
  });

  const upload = (): HTMLElement => screen.getByTestId('upload');

  const fireUpload = async (filename = 'test.csv'): Promise<void> => {
    const mFile = new File(['test'], filename);
    await act(async () => {
      const inputEl = screen.getByTestId('drop-input');
      Object.defineProperty(inputEl, 'files', { value: [mFile] });
      await fireEvent.drop(inputEl);
    });
  };

  it('renders successfully', async () => {
    expect(upload()).toBeDefined();
  });

  it('handles upload', async () => {
    await fireUpload();
    expect(screen.getByTestId('csv-options')).toBeDefined();
    await act(async () => {
      await fireEvent.click(screen.getByTestId('csv-options-load'));
    });
    expect(spies.uploadSpy).toHaveBeenCalledTimes(1);
    const [firstData] = spies.uploadSpy.mock.calls[0];
    const read = new FileReader();
    read.readAsBinaryString((firstData as any).entries().next().value[1]);
    read.onloadend = (): void => {
      expect(read.result).toBe('data:application/octet-stream;base64,dGVzdA==');
    };
    expect((firstData as any).entries().next().value[0]).toBe('test.csv');
    expect(assignSpy).toHaveBeenCalledWith('/2');
  });

  it('handles upload error', async () => {
    spies.uploadSpy.mockResolvedValue({
      success: false,
      error: 'error test',
    });
    await fireUpload('test.parquet');
    expect(screen.getByRole('alert').getElementsByTagName('span')[0].textContent).toBe('error test');
  });

  it('DataViewer: upload window', async () => {
    jest
      .spyOn(windowUtils, 'getLocation')
      .mockReturnValue({ pathname: '/dtale/popup/upload', href: '', reload: reloadSpy, assign: assignSpy } as any);
    await fireUpload();
    await act(async () => {
      fireEvent.click(screen.getByTestId('csv-options').getElementsByClassName('ico-check-box')[0]);
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('csv-options').getElementsByTagName('button')[4]);
    });
    await act(async () => {
      fireEvent.change(screen.getByTestId('csv-options').getElementsByTagName('input')[0], { target: { value: '=' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('csv-options-load'));
    });

    expect(spies.uploadSpy).toHaveBeenCalledTimes(1);
    const [firstData] = spies.uploadSpy.mock.calls[0];
    expect(firstData.get('header')).toBe('false');
    expect(firstData.get('separatorType')).toBe('custom');
    expect(firstData.get('separator')).toBe('=');
    expect(window.close).toHaveBeenCalledTimes(1);
    expect(openerAssignSpy).toHaveBeenCalledWith('/2');
  });

  it('DataViewer: upload from web', async () => {
    await act(async () => {
      fireEvent.click(upload().getElementsByClassName('form-group')[0].getElementsByTagName('button')[0]);
    });
    await act(async () => {
      fireEvent.change(upload().getElementsByClassName('form-group')[1].getElementsByTagName('input')[0], {
        target: { value: 'http://test' },
      });
    });
    await act(async () => {
      fireEvent.change(upload().getElementsByClassName('form-group')[2].getElementsByTagName('input')[0], {
        target: { value: 'http://test' },
      });
    });
    await act(async () => {
      fireEvent.click(upload().getElementsByClassName('row')[1].getElementsByTagName('button')[0]);
    });
    expect(assignSpy).toHaveBeenCalledWith('/2');
  });

  it('DataViewer: upload dataset', async () => {
    await act(async () => {
      const formGroups = upload().getElementsByClassName('form-group');
      fireEvent.click(formGroups[formGroups.length - 1].getElementsByTagName('button')[0]);
    });
    expect(assignSpy).toHaveBeenCalledWith('/2');
  });

  it('DataViewer: cancel CSV upload', async () => {
    jest.spyOn(windowUtils, 'getLocation').mockReturnValue({ pathname: '/dtale/popup/upload' } as any);
    await fireUpload();
    await act(async () => {
      await fireEvent.click(getByTestId(document.body, 'csv-options-cancel'));
    });
    expect(spies.uploadSpy).not.toHaveBeenCalled();
    expect(screen.queryByTestId('csv-options-body')).toBeNull();
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
        const buttons = upload().getElementsByClassName('form-group')[0].getElementsByTagName('button');
        fireEvent.click(buttons[buttons.length - 1]);
      });
      await act(async () => {
        fireEvent.change(upload().getElementsByClassName('form-group')[1].getElementsByTagName('input')[0], {
          target: { value: 'http://test' },
        });
      });
      await act(async () => {
        fireEvent.change(upload().getElementsByClassName('form-group')[2].getElementsByTagName('input')[0], {
          target: { value: 'http://test' },
        });
      });
      await act(async () => {
        fireEvent.click(upload().getElementsByClassName('row')[1].getElementsByTagName('button')[0]);
      });
      expect(screen.getByTestId('sheet-selector')).toBeDefined();
      expect(screen.getByTestId('sheet-selector').textContent).toEqual('Sheet 1Sheet 2');
    });
  });
});
