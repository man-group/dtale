import _ from 'lodash';
import { act } from 'react-dom/test-utils';
import { expect } from '@jest/globals';

import { tickUpdate } from '../test-utils';

function findColMenuButton(result, name, btnTag = 'button') {
  const ColumnMenu = require('../../dtale/column/ColumnMenu').ReactColumnMenu;
  return result
    .find(ColumnMenu)
    .find(`ul li ${btnTag}`)
    .findWhere((b) => _.includes(b.text(), name));
}

async function clickColMenuButton(result, name, btnTag = 'button') {
  await act(async () => {
    findColMenuButton(result, name, btnTag).first().simulate('click');
  });
  result = result.update();
}

function clickColMenuSubButton(result, label, row = 0) {
  // need to import this component here because it is using fetcher.ts which gets mocked during run-time
  const ColumnMenu = require('../../dtale/column/ColumnMenu').ReactColumnMenu;
  result
    .find(ColumnMenu)
    .find('ul li div.column-sorting')
    .at(row)
    .find('button')
    .findWhere((b) => _.includes(b.html(), label))
    .first()
    .simulate('click');
}

async function openColMenu(result, colIdx) {
  await act(async () => {
    result.find('.main-grid div.headerCell').at(colIdx).find('.text-nowrap').simulate('click');
  });
  await act(async () => await tickUpdate(result));
  result = result.update();
}

function validateHeaders(result, headers) {
  expect(result.find('.main-grid div.headerCell').map((hc) => hc.find('.text-nowrap').text())).toEqual(headers);
}

export { findColMenuButton, clickColMenuButton, clickColMenuSubButton, openColMenu, validateHeaders };
