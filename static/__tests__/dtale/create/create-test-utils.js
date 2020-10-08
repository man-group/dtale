export function clickBuilder(result, name) {
  const CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;
  result
    .find(CreateColumn)
    .find("div.form-group")
    .at(1)
    .find("button")
    .findWhere(b => b.text() === name)
    .first()
    .simulate("click");
  result.update();
}
