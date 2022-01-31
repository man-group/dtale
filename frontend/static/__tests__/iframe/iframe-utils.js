import _ from 'lodash';
import { act } from 'react-dom/test-utils';
import { expect } from '@jest/globals';

import ColumnMenu from '../../dtale/column/ColumnMenu';

function findColMenuButton(result, name, btnTag = 'button') {
  return result
    .find(ColumnMenu)
    .find(`ul li ${btnTag}`)
    .findWhere((b) => _.includes(b.text(), name));
}

async function clickColMenuButton(result, name, btnTag = 'button') {
  await act(async () => {
    findColMenuButton(result, name, btnTag).first().simulate('click');
  });
  return result.update();
}

async function clickColMenuSubButton(result, label, row = 0) {
  await act(async () => {
    result
      .find(ColumnMenu)
      .find('ul li div.column-sorting')
      .at(row)
      .find('button')
      .findWhere((b) => _.includes(b.html(), label))
      .first()
      .simulate('click');
  });
  return result.update();
}

async function openColMenu(result, colIdx) {
  await act(async () => {
    result.find('.main-grid div.headerCell').at(colIdx).find('.text-nowrap').simulate('click');
  });
  return result.update();
}

function validateHeaders(result, headers) {
  expect(result.find('.main-grid div.headerCell').map((hc) => hc.find('.text-nowrap').text())).toEqual(headers);
}

export { findColMenuButton, clickColMenuButton, clickColMenuSubButton, openColMenu, validateHeaders };
