import { shallow } from "enzyme";
import _ from "lodash";
import React from "react";

import { ReactCorrelations as mockReactCorrelations } from "../../popups/Correlations";
import { ReactHistogram as mockReactHistogram } from "../../popups/Histogram";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { withGlobalJquery } from "../test-utils";

describe("PopupChart tests", () => {
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("../../popups/Histogram", () => ({ Histogram: mockReactHistogram }));
    jest.mock("../../popups/Correlations", () => ({ Correlations: mockReactCorrelations }));
  });

  test("PopupChart w/ Histogram initial rendering", () => {
    const ReactPopupChart = require("../../popups/PopupChart").ReactPopupChart;

    const props = {
      chartData: { visible: true, type: "histogram", title: "Histogram Test" },
    };

    const result = shallow(<ReactPopupChart {...props} onClose={_.noop} />);
    const title = _.join(
      result
        .find("ModalTitle")
        .children()
        .map(n => n.text()),
      ""
    ).trim();
    t.equal(title, "Histogram for Histogram Test", "Should render correct title");
    t.ok(result.find("Histogram").length, "should render histogram canvas");
  });

  test("PopupChart w/ Correlations initial rendering", () => {
    const ReactPopupChart = require("../../popups/PopupChart").ReactPopupChart;

    const props = {
      chartData: { visible: true, type: "correlations", title: "Correlations Test" },
    };

    const result = shallow(<ReactPopupChart {...props} onClose={_.noop} />);
    const title = _.join(
      result
        .find("ModalTitle")
        .children()
        .map(n => n.text()),
      ""
    ).trim();
    t.equal(title, "Correlations Test", "Should render correct title");
    t.ok(result.find("Correlations").length, "should render correlations chart canvas");
  });
});
