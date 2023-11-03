import { act, fireEvent } from '@testing-library/react';

import * as TestSupport from './Formatting.test.support';

describe('DataViewer tests', () => {
  const spies = new TestSupport.Spies();
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
    await spies.setupWrapper(2);
    expect(document.getElementsByClassName('modal-title')[0].textContent).toBe('Formatting');
    const formGroups = spies.body().querySelectorAll('div.form-group');
    await act(async () => {
      await fireEvent.click(formGroups[0].getElementsByTagName('i')[0]);
    });
    await act(async () => {
      await fireEvent.click(formGroups[1].getElementsByTagName('i')[0]);
    });
    await act(async () => {
      await fireEvent.change(formGroups[2].getElementsByTagName('input')[0], { target: { value: '2' } });
    });
    expect(spies.body().getElementsByClassName('row')[3].textContent).toBe(
      'Raw:I am a long piece of text, please truncate me.Truncated:...',
    );
    await spies.validateCfg('1', 'col3', { fmt: { link: false, html: true, truncate: 2 } }, false, 'nan');
    expect(spies.cell('3|1').textContent).toBe('...');
  });
});
