import { expect, it } from "@jest/globals";

describe("dtale tests", () => {
  const { location } = window;

  beforeAll(() => {
    delete window.location;
    window.location = {
      search: `col=foo&vals=a,b,c&baz=${JSON.stringify({ bizz: [1, 2] })}`,
    };
  });

  afterAll(() => {
    window.location = location;
  });

  it("dtale: testing getParams", () => {
    const actions = require("../../actions/dtale");
    const urlParams = actions.getParams();
    expect({
      col: "foo",
      vals: ["a", "b", "c"],
      baz: JSON.stringify({ bizz: [1, 2] }),
    }).toEqual(urlParams);
  });
});
