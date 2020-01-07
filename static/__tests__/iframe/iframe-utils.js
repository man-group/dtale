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

function clickColMenuSortButton(result, dir) {
  result
    .find(ColumnMenu)
    .find("ul li div.column-sorting")
    .first()
    .find("button")
    .findWhere(b => _.includes(b.text(), dir))
    .first()
    .simulate("click");
}

export { findColMenuButton, clickColMenuButton, clickColMenuSortButton };
