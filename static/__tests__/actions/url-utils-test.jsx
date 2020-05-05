import { expect, it } from "@jest/globals";

import { buildURLParams } from "../../actions/url-utils";

describe("url-utils tests", () => {
  it("url-utils: testing URL_KEYS", () => {
    let params = {
      filters: {},
      ids: [0, 5],
      sortInfo: [["col1", "ASC"]],
      query: "col == 3",
      selectedCols: ["col1", "col2"],
    };
    let urlParams = buildURLParams(params);
    expect(urlParams).toEqual({
      cols: '["col1","col2"]',
      query: "col == 3",
      sort: '[["col1","ASC"]]',
      ids: "[0,5]",
    });

    params = {
      filters: {
        col1: {
          filterTerm: "blah",
          column: { filterRenderer: { displayName: "StringFilter" } },
        },
      },
    };
    urlParams = buildURLParams(params);
    expect(urlParams).toEqual({
      filters: '{"col1":{"value":"blah","type":"StringFilter"}}',
    });

    urlParams = buildURLParams({}, null, ["ids"]);
    expect(urlParams).toEqual({});
  });
});
