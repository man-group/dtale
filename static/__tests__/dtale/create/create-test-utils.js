export function clickBuilder(result, name) {
  const CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;
  const buttonRow = result
    .find(CreateColumn)
    .find("div.form-group")
    .findWhere(row => row.find("button").findWhere(b => b.text() === name));
  buttonRow
    .find("button")
    .findWhere(b => b.text() === name)
    .first()
    .simulate("click");
  result.update();
}
