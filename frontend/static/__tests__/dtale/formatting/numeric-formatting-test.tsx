import { ReactWrapper } from 'enzyme';
import Modal from 'react-bootstrap/Modal';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { DataViewerData } from '../../../dtale/DataViewerState';
import Formatting from '../../../popups/formats/Formatting';
import NumericFormatting from '../../../popups/formats/NumericFormatting';
import { clickColMenuButton } from '../../iframe/iframe-utils';
import reduxUtils from '../../redux-test-utils';

import * as TestSupport from './Formatting.test.support';

describe('NumericFormatting', () => {
  const spies = new TestSupport.Spies();
  const { open } = window;
  let result: ReactWrapper;
  const openFn = jest.fn();

  beforeAll(() => {
    spies.beforeAll();
    delete (window as any).open;
    window.open = openFn;
  });

  beforeEach(async () => {
    spies.setupMockImplementations();
  });

  afterEach(() => {
    jest.resetAllMocks();
    result.unmount();
  });

  afterAll(() => {
    spies.afterAll();
    window.open = open;
  });

  const validateFormatting = async (expected: string, i: number): Promise<ReactWrapper> => {
    let clicker = result.find(NumericFormatting).find('div.form-group').at(i).find('button');
    if (i === 0) {
      clicker = clicker.last();
    } else {
      clicker = clicker.first();
    }
    await act(async () => {
      clicker.simulate('click');
    });
    result = result.update();
    expect(result.find(NumericFormatting).find('small').first().text()).toBe(expected);
    return result;
  };

  const toggleFormatting = async (toggleIdx: number): Promise<ReactWrapper> => {
    await act(async () => {
      result.find(NumericFormatting).find('div.form-group').at(toggleIdx).find('button').last().simulate('click');
    });
    return result.update();
  };

  it('applies formatting', async () => {
    result = await spies.setupWrapper(1);
    expect(result.find(NumericFormatting)).toHaveLength(1);
    await act(async () => {
      result.find(Formatting).find(Modal.Header).first().find('button').simulate('click');
    });
    result = result.update();
    expect(result.find(Formatting).find(Modal).props().show).toBe(false);
    result = await clickColMenuButton(result, 'Formats');
    await act(async () => {
      result.find(NumericFormatting).find('i.ico-info-outline').first().simulate('click');
    });
    result = result.update();
    expect(openFn.mock.calls[openFn.mock.calls.length - 1][0]).toBe('http://numeraljs.com/#format');
    result = await validateFormatting('EX: -123456.789 => -123456.789000', 0);
    result = await validateFormatting('EX: -123456.789 => -123,456.789000', 1);
    result = await validateFormatting('EX: -123456.789 => -123.456789k', 2);
    result = await validateFormatting('EX: -123456.789 => -1.234568e+5', 3);
    result = await validateFormatting('EX: -123456.789 => 1.23456789b-BPS', 4);
    await act(async () => {
      result.find(NumericFormatting).find('div.form-group').at(5).find('button').first().simulate('click');
    });
    result = result.update();
    expect(result.find(NumericFormatting).find('small').first().html().includes('style="color: red;"')).toBe(true);
    result = await toggleFormatting(1);
    result = await toggleFormatting(2);
    result = await toggleFormatting(3);
    result = await toggleFormatting(4);
    result = await toggleFormatting(5);
    await act(async () => {
      result.find(Formatting).find('div.form-group').last().find(Select).props().onChange({ value: '-' });
    });
    result = result.update();
    result = await spies.validateCfg(result, '1', 'col2', { fmt: '0.000000', style: { redNegs: false } }, false, '-');
    expect(result.find(Formatting).props().data['0'].col2.view).toBe('2.500000');
    expect(spies.store?.getState().settings.nanDisplay).toBe('-');
  });

  it('applies formatting to all columns of a similar data type', async () => {
    spies.axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/data')) {
        return Promise.resolve({
          data: {
            ...reduxUtils.DATA,
            results: reduxUtils.DATA.results.map((r: DataViewerData) => ({ ...r, col5: (r as any).col1 })),
            columns: [...reduxUtils.DATA.columns, { ...reduxUtils.DTYPES.dtypes[0], name: 'col5' }],
          },
        });
      } else if (url.startsWith('/dtale/dtypes')) {
        return Promise.resolve({
          data: {
            ...reduxUtils.DTYPES,
            dtypes: [...reduxUtils.DTYPES.dtypes, { ...reduxUtils.DTYPES.dtypes[0], name: 'col5' }],
          },
        });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    result = await spies.setupWrapper(0);
    await act(async () => {
      result.find(NumericFormatting).find('div.form-group').first().find('button').last().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find(Formatting).find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    result = await spies.validateCfg(result, '1', 'col1', { fmt: '0.000000', style: { redNegs: false } }, true, 'nan');
    expect(result.find(Formatting).props().data['0'].col1.view).toBe('1.000000');
    expect(result.find(Formatting).props().data['0'].col5.view).toBe('1.000000');
  });
});
