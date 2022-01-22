import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';

import DateFormatting from '../../../popups/formats/DateFormatting';
import Formatting from '../../../popups/formats/Formatting';

import * as TestSupport from './Formatting.test.support';

describe('DateFormatting', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;
  const { open } = window;
  const openFn = jest.fn();

  beforeAll(() => {
    spies.beforeAll();
    delete (window as any).open;
    window.open = openFn;
  });

  beforeEach(async () => {
    spies.setupMockImplementations();
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    spies.afterAll();
    window.open = open;
  });

  it('applies formatting', async () => {
    result = await spies.setupWrapper(3);
    expect(result.find(DateFormatting)).toHaveLength(1);
    await act(async () => {
      result.find(Formatting).find('i.ico-info-outline').first().simulate('click');
    });
    result = result.update();
    const momentUrl = 'https://momentjs.com/docs/#/displaying/format/';
    expect(openFn.mock.calls[openFn.mock.calls.length - 1][0]).toBe(momentUrl);
    const input = result.find(DateFormatting).find('div.form-group').at(0).find('input');
    await act(async () => {
      input.simulate('change', { target: { value: 'YYYYMMDD' } });
    });
    result = result.update();
    expect(result.find(DateFormatting).find('div.row').last().text()).toBe(
      'Raw:December 31st 1999, 7:00:00 pmFormatted:19991231',
    );
    result = await spies.validateCfg(result, '1', 'col4', { fmt: 'YYYYMMDD' }, false, 'nan');
    const grid = result.find(MultiGrid).first().instance();
    expect(grid.props.data['0'].col4.view.length).toBe(8);
  });
});
