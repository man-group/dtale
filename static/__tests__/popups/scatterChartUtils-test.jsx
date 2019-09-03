import _ from "lodash";

import corrUtils from "../../popups/correlations/correlationsUtils";
import { formatScatterPoints } from "../../popups/scatterChartUtils";
import * as t from "../jest-assertions";

describe("scatterChartUtils tests", () => {
  test("scatterChartUtils: testing filtering/highlighting logic", done => {
    const data = [
      { col: 1.4, col2: 1.5, index: 0 },
      { col: 2.4, col2: 1.5, index: 1 },
      { col: 3.4, col2: 2.1, index: 2 },
      { col: 4.4, col2: 1.3, index: 3 },
      { col: 9.1, col2: -3.7, index: 4 },
      { col: 0.2, col2: 6.6, index: 5 },
      { col: -1.3, col2: 1.9, index: 6 },
      { col: 5.6, col2: 8.8, index: 7 },
      { col: 3.7, col2: 7.2, index: 8 },
      { col: 4.2, col2: 3.0, index: 9 },
    ];
    const scatterData = formatScatterPoints(
      data,
      corrUtils.pointFormatter("col", "col2"),
      _.matches({ index: 0 }),
      _.matches({ index: 9 })
    );
    t.deepEqual(scatterData.pointRadius, [3, 3, 3, 3, 3, 3, 3, 3, 0, 5], "should set correct radii");
    done();
  });
});
