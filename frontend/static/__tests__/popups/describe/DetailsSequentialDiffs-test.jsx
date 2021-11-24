import { mount } from 'enzyme';
import _ from 'lodash';
import React from 'react';
import { Provider } from 'react-redux';

import mockPopsicle from '../../MockPopsicle';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';

const DATA = {
  avg: '1',
  diffs: {
    data: [{ count: '5', value: '1' }],
    top: false,
    total: 1,
  },
  max: '1',
  min: '1',
};

describe('DetailSequentialDiffs test', () => {
  let result, ReactDetailsSequentialDiffs;

  beforeAll(() => {
    mockPopsicle((url) => {
      if (_.startsWith(url, '/dtale/sorted-sequential-diffs')) {
        return DATA;
      }
      return undefined;
    });
  });

  beforeEach(async () => {
    const DetailsSequentialDiffs = require('../../../popups/describe/DetailsSequentialDiffs');
    ReactDetailsSequentialDiffs = DetailsSequentialDiffs.ReactDetailsSequentialDiffs;
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    result = mount(
      <Provider store={store}>
        <DetailsSequentialDiffs.DetailsSequentialDiffs data={DATA} column={'a'} />
      </Provider>,
      {
        attachTo: document.getElementById('content'),
      },
    );
  });

  it('correctly toggles between base data and sorted data', async () => {
    let diffs = result.find(ReactDetailsSequentialDiffs);
    expect(diffs).toHaveLength(1);
    diffs.find('ButtonToggle').prop('update')('ASC');
    await tickUpdate(result);
    diffs = result.find(ReactDetailsSequentialDiffs);
    expect(diffs.state().sortedDiffs.ASC).toBeDefined();
  });
});
