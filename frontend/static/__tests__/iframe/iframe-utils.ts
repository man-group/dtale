import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';

import ColumnMenu from '../../dtale/column/ColumnMenu';

export const findColMenuButton = (result: ReactWrapper, name: string, btnTag = 'button'): ReactWrapper => {
  return result
    .find(ColumnMenu)
    .find(`ul li ${btnTag}`)
    .findWhere((b) => b.text().includes(name));
};

export const clickColMenuButton = async (
  result: ReactWrapper,
  name: string,
  btnTag = 'button',
): Promise<ReactWrapper> => {
  await act(async () => {
    findColMenuButton(result, name, btnTag).first().simulate('click');
  });
  return result.update();
};

export const clickColMenuSubButton = async (result: ReactWrapper, label: string, row = 0): Promise<ReactWrapper> => {
  await act(async () => {
    result
      .find(ColumnMenu)
      .find('ul li div.column-sorting')
      .at(row)
      .find('button')
      .findWhere((b) => b.html().includes(label))
      .first()
      .simulate('click');
  });
  return result.update();
};

export const openColMenu = async (result: ReactWrapper, colIdx: number): Promise<ReactWrapper> => {
  await act(async () => {
    result.find('.main-grid div.headerCell').at(colIdx).find('.text-nowrap').simulate('click');
  });
  return result.update();
};

export const validateHeaders = (result: ReactWrapper, headers: string[]): void => {
  expect(result.find('.main-grid div.headerCell').map((hc) => hc.find('.text-nowrap').text())).toEqual(headers);
};
