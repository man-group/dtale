import { buildURLParams } from "../../actions/url-utils";
import * as t from "../jest-assertions";

describe("url-utils tests", () => {
  test("url-utils: testing URL_KEYS", done => {
    let params = {
      filters: {},
      ids: [0, 5],
      sortInfo: [["col1", "ASC"]],
      query: "col == 3",
      selectedCols: ["col1", "col2"],
    };
    let urlParams = buildURLParams(params);
    t.deepEqual(
      urlParams,
      {
        cols: '["col1","col2"]',
        query: "col == 3",
        sort: '[["col1","ASC"]]',
        ids: "[0,5]",
      },
      "should serialize parameters"
    );

    params = {
      filters: {
        col1: {
          filterTerm: "blah",
          column: { filterRenderer: { displayName: "StringFilter" } },
        },
      },
    };
    urlParams = buildURLParams(params);
    t.deepEqual(
      urlParams,
      { filters: '{"col1":{"value":"blah","type":"StringFilter"}}' },
      "should serialize filters parameters"
    );

    urlParams = buildURLParams({}, null, ["ids"]);
    t.deepEqual(urlParams, {}, "should return empty object when missing required field");
    done();
  });
});
