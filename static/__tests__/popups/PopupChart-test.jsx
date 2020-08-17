import { shallow } from "enzyme";
import _ from "lodash";
import React from "react";

import { expect, it } from "@jest/globals";

import { Correlations } from "../../popups/Correlations";
import { ReactColumnAnalysis } from "../../popups/analysis/ColumnAnalysis";
import { ReactCharts } from "../../popups/charts/Charts";
import mockPopsicle from "../MockPopsicle";
import { withGlobalJquery } from "../test-utils";

class MockCorrelations extends React.Component {
  render() {
    return <Correlations dataId="1" />;
  }
}
MockCorrelations.displayName = "Correlations";

class MockReactColumnAnalysis extends React.Component {
  render() {
    return <ReactColumnAnalysis dataId="1" />;
  }
}
MockReactColumnAnalysis.displayName = "ColumnAnalysis";

class MockReactCharts extends React.Component {
  render() {
    return <ReactCharts dataId="1" />;
  }
}
MockReactCharts.displayName = "Charts";

describe("Popup tests", () => {
  let ReactPopup;
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("../../popups/analysis/ColumnAnalysis", () => ({
      ColumnAnalysis: MockReactColumnAnalysis,
    }));
    jest.mock("../../popups/Correlations", () => ({
      Correlations: MockCorrelations,
    }));
    jest.mock("../../popups/charts/Charts", () => ({
      Charts: MockReactCharts,
    }));
    ReactPopup = require("../../popups/Popup").ReactPopup;
  });

  const buildResult = props => shallow(<ReactPopup {...props} onClose={_.noop} />);

  it("Popup w/ ColumnAnalysis initial rendering", () => {
    const props = {
      dataId: "1",
      chartData: {
        visible: true,
        type: "column-analysis",
        selectedCol: "foo",
      },
    };
    const result = buildResult(props);
    const title = _.join(
      result
        .find("ModalTitle")
        .children()
        .map(n => n.text()),
      ""
    ).trim();
    expect(title).toBe("Column Analysis for foo");
    expect(result.find("ColumnAnalysis").length).toBeGreaterThan(0);
  });

  it("Popup w/ Correlations initial rendering", () => {
    const props = {
      dataId: "1",
      chartData: {
        visible: true,
        type: "correlations",
        title: "Correlations Test",
      },
    };
    const result = buildResult(props);
    const title = _.join(
      result
        .find("ModalTitle")
        .children()
        .map(n => n.text()),
      ""
    ).trim();
    expect(title).toBe("Correlations Test");
    expect(result.find("Correlations").length).toBeGreaterThan(0);
  });
});
