import _ from "lodash";
import { expect } from "@jest/globals";

import { tick } from "../test-utils";

function findColMenuButton(result, name, btnTag = "button") {
  const ColumnMenu = require("../../dtale/column/ColumnMenu").ReactColumnMenu;
  return result
    .find(ColumnMenu)
    .find(`ul li ${btnTag}`)
    .findWhere(b => _.includes(b.text(), name));
}

function clickColMenuButton(result, name, btnTag = "button") {
  findColMenuButton(result, name, btnTag).first().simulate("click");
}

function clickColMenuSubButton(result, label, row = 0) {
  // need to import this component here because it is using fetcher.js which gets mocked during run-time
  const ColumnMenu = require("../../dtale/column/ColumnMenu").ReactColumnMenu;
  result
    .find(ColumnMenu)
    .find("ul li div.column-sorting")
    .at(row)
    .find("button")
    .findWhere(b => _.includes(b.html(), label))
    .first()
    .simulate("click");
}

async function openColMenu(result, colIdx) {
  result.find(".main-grid div.headerCell").at(colIdx).find(".text-nowrap").simulate("click");
  await tick();
}

function validateHeaders(result, headers) {
  expect(result.find(".main-grid div.headerCell").map(hc => hc.find(".text-nowrap").text())).toEqual(headers);
}

export { findColMenuButton, clickColMenuButton, clickColMenuSubButton, openColMenu, validateHeaders };
