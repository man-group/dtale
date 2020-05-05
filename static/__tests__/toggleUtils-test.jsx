import { expect, it } from "@jest/globals";

import { buildButton } from "../toggleUtils";

describe("toggleUtils tests", () => {
  it("toggleUtils: testing buildButton", () => {
    let props = buildButton(true, () => "active");
    expect(props.className).toBe("btn btn-primary active");
    expect(props.onClick()).toBeUndefined();
    props = buildButton(false, () => "active", true);
    expect(props.className).toBe("btn btn-primary ");
    expect(props.onClick()).toBe("active");
    expect(props.disabled).toBe(true);
  });
});
