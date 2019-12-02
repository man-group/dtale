import _ from "lodash";

import { ReactColumnMenu as ColumnMenu } from "../../dtale/iframe/ColumnMenu";

function clickColMenuButton(result, name, btnTag = "button") {
  result
    .find(ColumnMenu)
    .find(`ul li ${btnTag}`)
    .findWhere(b => _.includes(b.text(), name))
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

export { clickColMenuButton, clickColMenuSortButton };
