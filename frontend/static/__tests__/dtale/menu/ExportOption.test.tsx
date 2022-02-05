import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import * as redux from 'react-redux';

import { VoidFunc } from '../../../dtale/menu/dataViewerMenuUtils';
import ExportOption, { ExportType } from '../../../dtale/menu/ExportOption';

describe('ExportOption', () => {
  let wrapper: ReactWrapper;
  let openCsvMock: jest.Mock<() => void>;
  let openTsvMock: jest.Mock<() => void>;
  let openParquetMock: jest.Mock<() => void>;

  beforeEach(() => {
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(jest.fn());
    openCsvMock = jest.fn();
    openTsvMock = jest.fn();
    openParquetMock = jest.fn();
    const open = (exportType: ExportType): VoidFunc => {
      switch (exportType) {
        case ExportType.CSV:
          return openCsvMock;
        case ExportType.TSV:
          return openTsvMock;
        case ExportType.PARQUET:
        default:
          return openParquetMock;
      }
    };
    wrapper = mount(<ExportOption open={open} />);
  });

  it('fires CSV export action', () => {
    wrapper.find('button').first().simulate('click');
    expect(openCsvMock).toHaveBeenCalled();
  });

  it('fires TSV export action', () => {
    wrapper.find('button').at(1).simulate('click');
    expect(openTsvMock).toHaveBeenCalled();
  });

  it('fires parquet export action', () => {
    wrapper.find('button').last().simulate('click');
    expect(openParquetMock).toHaveBeenCalled();
  });
});
