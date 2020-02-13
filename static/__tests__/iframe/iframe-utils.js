import _ from "lodash";

import { ReactColumnMenu as ColumnMenu } from "../../dtale/iframe/ColumnMenu";

function findColMenuButton(result, name, btnTag = "button") {
  return result
    .find(ColumnMenu)
    .find(`ul li ${btnTag}`)
    .findWhere(b => _.includes(b.text(), name));
}

function clickColMenuButton(result, name, btnTag = "button") {
  findColMenuButton(result, name, btnTag)
    .first()
    .simulate("click");
}

function clickColMenuSubButton(result, label, row = 0) {
  result
    .find(ColumnMenu)
    .find("ul li div.column-sorting")
    .at(row)
    .find("button")
    .findWhere(b => _.includes(b.text(), label))
    .first()
    .simulate("click");
}

export { findColMenuButton, clickColMenuButton, clickColMenuSubButton };
