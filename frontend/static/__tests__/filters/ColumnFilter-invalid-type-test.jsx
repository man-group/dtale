import { mount } from 'enzyme';
import _ from 'lodash';
import React from 'react';
import Select from 'react-select';

import mockPopsicle from '../MockPopsicle';
import { buildInnerHTML, tickUpdate } from '../test-utils';

describe('ColumnFilter string tests', () => {
  let ColumnFilter, StringFilter;

  beforeAll(() => {
    mockPopsicle((url) => {
      if (_.startsWith(url, '/dtale/column-filter-data/1?col=col3')) {
        return { success: true, hasMissing: true, uniques: ['a', 'b', 'c'] };
      }
      if (_.startsWith(url, '/dtale/toggle-outlier-filter/1?col=col3')) {
        return { success: true, outlierFilters: {} };
      }
      return undefined;
    });

    ColumnFilter = require('../../filters/ColumnFilter').default;
    StringFilter = require('../../filters/StringFilter').default;
  });

  beforeEach(buildInnerHTML);

  it('ColumnFilter invalid type rendering', async () => {
    let props = {
      dataId: '1',
      selectedCol: 'col3',
      columns: [{ name: 'col3', dtype: 'error', visible: true, hasOutliers: true }],
      columnFilters: { col3: { value: ['b'] } },
      outlierFilters: { col3: { query: 'blah' } },
      updateSettings: jest.fn(),
    };
    const updateSettings = (state) => (props = _.assignIn(props, state));
    const result = mount(<ColumnFilter {...props} updateSettings={updateSettings} />, {
      attachTo: document.getElementById('content'),
    });
    await tickUpdate(result);
    expect(result.find(StringFilter).length).toBe(1);
    result.find('i.ico-check-box-outline-blank').simulate('click');
    await tickUpdate(result);
    expect(result.find('.Select__control--is-disabled').length).toBeGreaterThan(0);
    result.find('i.ico-check-box').first().simulate('click');
    await tickUpdate(result);
    result.find('i.ico-check-box').last().simulate('click');
    await tickUpdate(result);
    expect(props.outlierFilters).toEqual({});
    expect(result.find('.Select__control--is-disabled').length).toBe(0);
    const uniqueSelect = result.find(Select);
    uniqueSelect
      .last()
      .props()
      .onChange([{ value: 'a' }]);
    await tickUpdate(result);
    expect(result.state().cfg).toEqual(
      expect.objectContaining({
        type: 'string',
        operand: '=',
        value: ['a'],
      }),
    );
    result.find('StringFilter').find('button').first().simulate('click');
    await tickUpdate(result);
    expect(result.state().cfg).toEqual(
      expect.objectContaining({
        type: 'string',
        operand: 'ne',
        value: ['a'],
      }),
    );
  });
});
