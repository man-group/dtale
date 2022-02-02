import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';

import { VoidFunc } from '../../../dtale/menu/dataViewerMenuUtils';
import ExportOption from '../../../dtale/menu/ExportOption';

describe('ExportOption', () => {
  let wrapper: ShallowWrapper;
  let openCsvMock: jest.Mock<() => void>;
  let openTsvMock: jest.Mock<() => void>;
  let openParquetMock: jest.Mock<() => void>;

  beforeEach(() => {
    openCsvMock = jest.fn();
    openTsvMock = jest.fn();
    openParquetMock = jest.fn();
    const open = (exportType: string): VoidFunc => {
      switch (exportType) {
        case 'csv':
          return openCsvMock;
        case 'tsv':
          return openTsvMock;
        case 'parquet':
        default:
          return openParquetMock;
      }
    };
    wrapper = shallow(<ExportOption open={open} />);
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
