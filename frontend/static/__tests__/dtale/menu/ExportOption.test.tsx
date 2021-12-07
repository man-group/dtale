import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';
import { TFunction } from 'react-i18next';

import { ExportOption } from '../../../dtale/menu/ExportOption';

/** Component properties for ExportOption */
export interface ExportOptionProps {
  open: (fileType: string) => void;
  t: TFunction;
}

describe('ExportOption', () => {
  let wrapper: ShallowWrapper<ExportOptionProps>;
  let openCsvMock: jest.Mock<() => void>;
  let openTsvMock: jest.Mock<() => void>;
  let openParquetMock: jest.Mock<() => void>;
  let props: ExportOptionProps;

  beforeEach(() => {
    openCsvMock = jest.fn();
    openTsvMock = jest.fn();
    openParquetMock = jest.fn();
    const open = (exportType: string): (() => void) => {
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
    props = { open, t: (key: string) => key };
    wrapper = shallow(<ExportOption {...props} />);
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
