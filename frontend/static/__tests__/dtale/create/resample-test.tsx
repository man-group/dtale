import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { CreateColumnType, SaveAs } from '../../../popups/create/CreateColumnState';
import { default as Resample } from '../../../popups/reshape/Resample';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateResample', () => {
  const { location, open } = window;
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeAll(() => {
    delete (window as any).location;
    (window as any).location = { href: 'http://localhost:8080/dtale/main/1', pathname: '/dtale/1' };
    delete (window as any).open;
    window.open = jest.fn();
  });

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Resample');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    spies.afterAll();
    window.location = location;
    window.open = open;
  });

  const resampleComp = (): ReactWrapper => result.find(Resample).first();

  it('builds resample data', async () => {
    expect(result.find(Resample)).toHaveLength(1);
    await act(async () => {
      resampleComp().find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      resampleComp()
        .find('div.form-group.row')
        .at(2)
        .find('input')
        .first()
        .simulate('change', { target: { value: '17min' } });
    });
    result = result.update();
    await act(async () => {
      resampleComp().find(Select).last().props().onChange({ value: 'mean' });
    });
    result = result.update();
    spies.saveSpy.mockResolvedValue({ success: true, data_id: '9999' });
    await spies.validateCfg(
      result,
      {
        cfg: {
          agg: 'mean',
          columns: undefined,
          freq: '17min',
          index: 'col1',
        },
        saveAs: SaveAs.NONE,
        type: CreateColumnType.RESAMPLE,
        output: 'new',
        name: undefined,
      },
      '1',
      'reshape',
    );
    expect(window.open).toHaveBeenCalledWith('http://localhost:8080/dtale/main/9999', '_blank');
  });
});
