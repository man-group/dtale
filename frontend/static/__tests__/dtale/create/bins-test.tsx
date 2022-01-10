import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import * as customHooks from '../../../customHooks';
import { ColumnAnalysisChart } from '../../../popups/analysis/ColumnAnalysisChart';
import { BinsTester } from '../../../popups/create/BinsTester';
import { default as CreateBins, validateBinsCfg } from '../../../popups/create/CreateBins';
import { BinsOperation, CreateColumnType } from '../../../popups/create/CreateColumnState';
import { mockChartJS, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateBins', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeAll(() => mockChartJS());

  beforeEach(async () => {
    spies.setupMockImplementations();
    const useDebounceSpy = jest.spyOn(customHooks, 'useDebounce');
    useDebounceSpy.mockImplementation((value) => value);
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Bins');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const binInputs = (): ReactWrapper => result.find(CreateBins).first();

  it('builds bins cut column', async () => {
    expect(result.find(CreateBins)).toHaveLength(1);

    await act(async () => {
      binInputs().find(Select).first().props().onChange({ value: 'col2' });
    });
    result = result.update();
    await act(async () => {
      binInputs().find('div.form-group').at(1).find('button').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      binInputs()
        .find('div.form-group')
        .at(2)
        .find('input')
        .simulate('change', { target: { value: '4' } });
    });
    result = result.update();
    await act(async () => {
      binInputs()
        .find('div.form-group')
        .at(3)
        .find('input')
        .simulate('change', { target: { value: 'foo,bar,bin,baz' } });
    });
    result = result.update();

    expect(result.find(BinsTester).find(ColumnAnalysisChart)).toHaveLength(1);

    await spies.validateCfg(result, {
      cfg: {
        col: 'col2',
        bins: '4',
        labels: 'foo,bar,bin,baz',
        operation: BinsOperation.CUT,
      },
      name: 'col2_bins',
      type: CreateColumnType.BINS,
    });

    const cfg = { col: null } as any;
    expect(validateBinsCfg(t, cfg)).toBe('Missing a column selection!');
    cfg.col = 'x';
    cfg.bins = '';
    expect(validateBinsCfg(t, cfg)).toBe('Missing a bins selection!');
    cfg.bins = '4';
    cfg.labels = 'foo';
    expect(validateBinsCfg(t, cfg)).toBe('There are 4 bins, but you have only specified 1 labels!');
  });

  it('builds bins qcut column', async () => {
    await act(async () => {
      result
        .find('div.form-group')
        .first()
        .find('input')
        .first()
        .simulate('change', { target: { value: 'qcut_col' } });
    });
    result = result.update();
    await act(async () => {
      binInputs().find(Select).first().props().onChange({ value: 'col2' });
    });
    result = result.update();
    await act(async () => {
      binInputs().find('div.form-group').at(1).find('button').last().simulate('click');
    });
    result = result.update();
    await act(async () => {
      binInputs()
        .find('div.form-group')
        .at(2)
        .find('input')
        .simulate('change', { target: { value: '4' } });
    });
    result = result.update();

    await spies.validateCfg(result, {
      cfg: {
        col: 'col2',
        bins: '4',
        labels: '',
        operation: BinsOperation.QCUT,
      },
      name: 'qcut_col',
      type: CreateColumnType.BINS,
    });
  });
});
