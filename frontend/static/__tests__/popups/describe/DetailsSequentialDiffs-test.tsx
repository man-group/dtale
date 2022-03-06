import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import ButtonToggle from '../../../ButtonToggle';
import { SequentialDiffs } from '../../../popups/describe/DescribeState';
import DetailsSequentialDiffs from '../../../popups/describe/DetailsSequentialDiffs';
import { SortDir } from '../../../redux/state/AppState';
import * as DescribeRepository from '../../../repository/DescribeRepository';
import reduxUtils from '../../redux-test-utils';

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
  let result: ReactWrapper;
  let loadSequentialDiffsSpy: jest.SpyInstance<
    Promise<DescribeRepository.SequentialDiffsResponse | undefined>,
    [dataId: string, col: string, sort: SortDir]
  >;

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/sorted-sequential-diffs')) {
        return Promise.resolve({ data: DATA });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue('1');
    loadSequentialDiffsSpy = jest.spyOn(DescribeRepository, 'loadSequentialDiffs');

    result = mount(<DetailsSequentialDiffs data={DATA} column={'a'} />);
  });

  afterEach(jest.restoreAllMocks);

  it('correctly toggles between base data and sorted data', async () => {
    await act(async () => {
      result.find(ButtonToggle).props().update(SortDir.ASC);
    });
    result = result.update();
    expect(result.find(ButtonToggle).props().defaultValue).toBe(SortDir.ASC);
    expect(loadSequentialDiffsSpy).toHaveBeenCalledWith('1', 'a', SortDir.ASC);
  });
});
