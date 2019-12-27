import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import CorrelationsTsOptions from "../../popups/correlations/CorrelationsTsOptions";
import * as t from "../jest-assertions";

describe("CorrelationsTsOptions tests", () => {
  test("CorrelationsTsOptions hasDate == false", done => {
    const result = mount(<CorrelationsTsOptions hasDate={false} />);
    result.render();
    t.ok(_.isNull(result.html()), "should render anything");
    done();
  });

  test("CorrelationsTsOptions selectedCols empty", done => {
    const result = mount(<CorrelationsTsOptions hasDate={true} selectedCols={[]} />);
    result.render();
    t.ok(_.isNull(result.html()), "should render anything");
    done();
  });
});
