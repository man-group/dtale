import * as t from "../jest-assertions";

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

  test("dtale: testing getParams", done => {
    const actions = require("../../actions/dtale").default;
    const urlParams = actions.getParams();
    t.deepEqual(
      {
        col: "foo",
        vals: ["a", "b", "c"],
        baz: JSON.stringify({ bizz: [1, 2] }),
      },
      urlParams,
      "should parse parameters"
    );
    done();
  });
});
