import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

import { SequentialDiffs } from '../../../popups/describe/DescribeState';
import DetailsSequentialDiffs from '../../../popups/describe/DetailsSequentialDiffs';
import { SortDir } from '../../../redux/state/AppState';
import * as DescribeRepository from '../../../repository/DescribeRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

const DATA: SequentialDiffs = {
  avg: '1',
  diffs: {
    data: [{ count: 5, value: '1' }],
    top: false,
    total: 1,
  },
  max: '1',
  min: '1',
};

describe('DetailSequentialDiffs test', () => {
  let loadSequentialDiffsSpy: jest.SpyInstance<
    Promise<DescribeRepository.SequentialDiffsResponse | undefined>,
    [dataId: string, col: string, sort: SortDir]
  >;

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/sorted-sequential-diffs')) {
        return Promise.resolve({ data: DATA });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    loadSequentialDiffsSpy = jest.spyOn(DescribeRepository, 'loadSequentialDiffs');

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    await act(
      () =>
        render(
          <Provider store={store}>
            <DetailsSequentialDiffs data={DATA} column={'a'} />
          </Provider>,
          { container: document.getElementById('content') ?? undefined },
        ).container,
    );
  });

  afterEach(jest.restoreAllMocks);

  it('correctly toggles between base data and sorted data', async () => {
    await act(async () => {
      await fireEvent.click(screen.getByText('Asc'));
    });
    expect(screen.getByText('Asc')).toHaveClass('active');
    expect(loadSequentialDiffsSpy).toHaveBeenCalledWith('1', 'a', SortDir.ASC);
  });
});
