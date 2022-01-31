import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';

import StringFormatting from '../../../popups/formats/StringFormatting';

import * as TestSupport from './Formatting.test.support';

describe('DataViewer tests', () => {
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
    result = await spies.setupWrapper(2);
    expect(result.find(StringFormatting)).toHaveLength(1);
    await act(async () => {
      result.find(StringFormatting).find('div.form-group').at(0).find('i').simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find(StringFormatting).find('div.form-group').at(1).find('i').simulate('click');
    });
    result = result.update();
    await act(async () => {
      result
        .find(StringFormatting)
        .find('div.form-group')
        .at(2)
        .find('input')
        .simulate('change', { target: { value: '2' } });
    });
    result = result.update();
    expect(result.find(StringFormatting).find('div.row').last().text()).toBe(
      'Raw:I am a long piece of text, please truncate me.Truncated:...',
    );
    result = await spies.validateCfg(
      result,
      '1',
      'col3',
      { fmt: { link: false, html: true, truncate: 2 } },
      false,
      'nan',
    );
    const grid = result.find(MultiGrid).first().instance();
    expect(grid.props.data['0'].col3.view).toBe('...');
  });
});
