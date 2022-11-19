import { act, fireEvent, getByTestId } from '@testing-library/react';

import * as TestSupport from './Formatting.test.support';

describe('DateFormatting', () => {
  const spies = new TestSupport.Spies();
  let result: Element;
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
    expect(document.getElementsByClassName('modal-title')[0].textContent).toBe('Formatting');
    await act(async () => {
      fireEvent.click(document.getElementsByClassName('ico-info-outline')[0]);
    });
    const momentUrl = 'https://momentjs.com/docs/#/displaying/format/';
    expect(openFn.mock.calls[openFn.mock.calls.length - 1][0]).toBe(momentUrl);
    const input = document
      .getElementsByClassName('modal-body')[0]
      .querySelector('div.form-group')!
      .getElementsByTagName('input');
    await act(async () => {
      fireEvent.change(input[0], { target: { value: 'YYYYMMDD' } });
    });
    expect(getByTestId(document.body, 'date-format-examples').textContent).toBe(
      'Raw:December 31st 1999, 7:00:00 pmFormatted:19991231',
    );
    await spies.validateCfg('1', 'col4', { fmt: 'YYYYMMDD' }, false, 'nan');
    expect(result.getElementsByClassName('cell')[8].textContent?.length).toBe(8);
  });
});
