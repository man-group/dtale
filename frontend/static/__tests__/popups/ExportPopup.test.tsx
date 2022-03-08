import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import Export from '../../popups/Export';
import Popup from '../../popups/Popup';
import { AppState, PopupType } from '../../redux/state/AppState';
import { StyledSlider } from '../../sliderUtils';

describe('ExportOption', () => {
  const openSpy = jest.fn();
  let wrapper: ReactWrapper;

  beforeAll(() => {
    delete (window as any).open;
    window.open = openSpy;
  });

  const setupMock = async (overrides?: Partial<AppState>): Promise<void> => {
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue({
      dataId: '0',
      chartData: { visible: true, type: PopupType.EXPORT, rows: 50 },
      settings: { sortInfo: [] },
      ...overrides,
    });
    wrapper = mount(<Popup propagateState={jest.fn()} />);
  };

  beforeEach(() => {
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(jest.fn());
    setupMock();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    window.open = open;
  });

  it('fires CSV export action', () => {
    wrapper.find(Export).find('button').first().simulate('click');
    expect(openSpy.mock.calls[0][0].startsWith('/dtale/data-export/0?type=csv&_id=')).toBe(true);
  });

  it('fires TSV export action', () => {
    wrapper.find('button').at(1).simulate('click');
    expect(openSpy.mock.calls[0][0].startsWith('/dtale/data-export/0?type=tsv&_id=')).toBe(true);
  });

  it('fires parquet export action', () => {
    wrapper.find('button').at(2).simulate('click');
    expect(openSpy.mock.calls[0][0].startsWith('/dtale/data-export/0?type=parquet&_id=')).toBe(true);
  });

  it('fires html export action', () => {
    wrapper.find('button').last().simulate('click');
    expect(openSpy.mock.calls[0][0].startsWith('/dtale/data/0?export=true&export_rows=50&_id=')).toBe(true);
  });

  describe('HTML export over 10000 rows', () => {
    beforeEach(async () => {
      setupMock({ chartData: { visible: true, type: PopupType.EXPORT, rows: 11000 } });
      await act(async () => {
        wrapper.find('button').last().simulate('click');
      });
      wrapper = wrapper.update();
    });

    it("doesn't call window.open on initial click", async () => {
      expect(wrapper.find(Export).find('.row')).toHaveLength(4);
      expect(openSpy).not.toHaveBeenCalled();
    });

    it('calls window.open on button click', async () => {
      await act(async () => {
        wrapper.find(StyledSlider).props().onAfterChange(1000);
      });
      wrapper = wrapper.update();
      wrapper.find('button').last().simulate('click');
      expect(openSpy.mock.calls[0][0].startsWith('/dtale/data/0?export=true&export_rows=1000&_id=')).toBe(true);
    });
  });
});
