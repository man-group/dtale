import { screen } from '@testing-library/react';

import { DISABLED_URL_UPLOADS_MSG } from '../../../popups/upload/Upload';

import * as TestSupport from './Upload.test.support';

describe('Upload', () => {
  const { close, location, open, opener } = window;
  const spies = new TestSupport.Spies();

  beforeEach(async () => {
    delete (window as any).location;
    delete (window as any).close;
    delete (window as any).open;
    delete window.opener;
    (window as any).location = {
      reload: jest.fn(),
      pathname: '/dtale/column/1',
      href: '',
      assign: jest.fn(),
    };
    window.close = jest.fn();
    window.open = jest.fn();
    window.opener = { location: { assign: jest.fn(), pathname: '/dtale/column/1' } };
    spies.setupMockImplementations();
    await spies.setupWrapper({ enableWebUploads: 'False' });
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    spies.afterAll();
    window.location = location;
    window.close = close;
    window.open = open;
    window.opener = opener;
  });

  const upload = (): HTMLElement => screen.getByTestId('upload');

  it('renders successfully', async () => {
    expect(upload()).toBeDefined();
  });

  it('DataViewer: disabled web uploads', async () => {
    expect(upload().getElementsByClassName('form-group')[0].textContent).toBe(
      [
        DISABLED_URL_UPLOADS_MSG,
        'add enable_web_uploads=True to your dtale.show callrun this code before calling dtale.showimport ',
        'dtale.global_state as global_state\n',
        'global_state.set_app_settings(dict(enable_web_uploads=True))add enable_web_uploads = True to the [app] ',
        'section of your dtale.ini config file',
      ].join(''),
    );
  });
});
