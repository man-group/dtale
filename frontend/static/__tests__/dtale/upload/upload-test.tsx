import { act, fireEvent, queryByText, screen } from '@testing-library/react';

import * as TestSupport from './Upload.test.support';

describe('Upload', () => {
  const { close, location, open, opener } = window;
  const spies = new TestSupport.Spies();

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
    await spies.setupWrapper();
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    spies.afterAll();
    window.location = location;
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
    expect(window.location.assign).toBeCalledWith('/2');
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
    window.location.pathname = '/dtale/popup/upload';
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
    expect(window.close).toBeCalledTimes(1);
    expect(window.opener.location.assign).toBeCalledWith('/2');
  });

  it('DataViewer: cancel CSV upload', async () => {
    window.location.pathname = '/dtale/popup/upload';
    await fireUpload();
    await act(async () => {
      await fireEvent.click(screen.getByTestId('csv-options-cancel'));
    });
    expect(spies.uploadSpy).not.toHaveBeenCalled();
    expect(queryByText(document.body, 'Separator')).toBe(null);
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
    expect(window.location.assign).toBeCalledWith('/2');
  });

  it('DataViewer: upload dataset', async () => {
    await act(async () => {
      const formGroups = upload().getElementsByClassName('form-group');
      fireEvent.click(formGroups[formGroups.length - 1].getElementsByTagName('button')[0]);
    });
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
