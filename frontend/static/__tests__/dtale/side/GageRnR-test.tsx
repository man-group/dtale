import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';
import { Table } from 'react-virtualized';

import GageRnR from '../../../dtale/side/GageRnR';
import ColumnSelect from '../../../popups/create/ColumnSelect';
import { RemovableError } from '../../../RemovableError';
import * as DtypesRepository from '../../../repository/DtypesRepository';
import * as GageRnRRepository from '../../../repository/GageRnRRepository';
import reduxUtils from '../../redux-test-utils';
import { tickUpdate } from '../../test-utils';

const GageData = require('./gage_rnr.json');

describe('Gage R&R', () => {
  let wrapper: ReactWrapper;
  const dispatchSpy = jest.fn();

  const buildMock = async (): Promise<void> => {
    wrapper = mount(<GageRnR />);
    await act(async () => tickUpdate(wrapper));
    wrapper = wrapper.update();
  };

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue({ dataId: '1', settings: {} });
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    const runSpy = jest.spyOn(GageRnRRepository, 'run');
    runSpy.mockResolvedValue({ ...GageData });
    await buildMock();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully', async () => {
    expect(wrapper.find(ColumnSelect)).toHaveLength(2);
    await act(async () => {
      wrapper
        .find(ColumnSelect)
        .first()
        .props()
        .updateState({ operator: [{ value: 'col1' }] });
    });
    wrapper = wrapper.update();
    expect(wrapper.find(Table).props().rowCount).toBe(6);
  });

  it('handles dtype loading error gracefully', async () => {
    const loadDtypesSpy = jest.spyOn(DtypesRepository, 'loadDtypes');
    loadDtypesSpy.mockResolvedValue({ error: 'dtype error', success: false, dtypes: [] });
    await buildMock();
    expect(wrapper.find(RemovableError)).toHaveLength(1);
    loadDtypesSpy.mockRestore();
  });
});
