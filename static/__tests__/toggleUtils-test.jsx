import { buildButton } from "../toggleUtils";
import * as t from "./jest-assertions";

describe("toggleUtils tests", () => {
  test("toggleUtils: testing buildButton", done => {
    let props = buildButton(true, () => "active");
    t.equal(props.className, "btn btn-primary active");
    t.equal(props.onClick(), undefined);
    props = buildButton(false, () => "active", true);
    t.equal(props.className, "btn btn-primary ");
    t.equal(props.onClick(), "active");
    t.ok(props.disabled);
    done();
  });
});
