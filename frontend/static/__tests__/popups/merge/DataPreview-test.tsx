import { act, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';

import { DataPreview } from '../../../popups/merge/DataPreview';
import DimensionsHelper from '../../DimensionsHelper';
import { clickColMenuSubButton, openColMenu, validateHeaders } from '../../iframe/iframe-utils';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

describe('DataPreview', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
  });

  beforeEach(() => {
    (axios.get as any).mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => dimensions.afterAll());

  it('loads properly', async () => {
    buildInnerHTML({ settings: '' });
    await act(
      async () =>
        await render(<DataPreview dataId="1" />, {
          container: document.getElementById('content') ?? undefined,
        }).container,
    );
    await openColMenu(3);
    await clickColMenuSubButton('Asc');
    validateHeaders(['col1', 'col2', 'col3', '▲col4']);
  });
});
