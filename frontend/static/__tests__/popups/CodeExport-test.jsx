import { mount } from 'enzyme';
import _ from 'lodash';
import React from 'react';

import { RemovableError } from '../../RemovableError';
import mockPopsicle from '../MockPopsicle';
import { buildInnerHTML, tickUpdate } from '../test-utils';

describe('CodeExport tests', () => {
  let result;
  let testIdx = 1;

  beforeAll(() => {
    Object.defineProperty(global.document, 'queryCommandSupported', {
      value: () => true,
    });
    Object.defineProperty(global.document, 'execCommand', { value: _.noop });

    mockPopsicle((url) => {
      if (_.startsWith(url, '/dtale/code-export/1')) {
        return { success: true, code: 'test code' };
      }
      if (_.startsWith(url, '/dtale/code-export/2')) {
        return { success: false, error: 'error test' };
      }
      return undefined;
    });
  });

  beforeEach(async () => {
    const { CodeExport } = require('../../popups/CodeExport');
    buildInnerHTML();
    result = mount(<CodeExport dataId={'' + testIdx++} />, {
      attachTo: document.getElementById('content'),
    });
    await tickUpdate(result);
  });

  it('CodeExport render & copy test', async () => {
    expect(result.find('pre').text()).toBe('test code');
    result.find('button').simulate('click');
  });

  it('CodeExport error test', async () => {
    expect(result.find(RemovableError).text()).toBe('error test');
  });
});
