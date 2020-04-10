import { shallow } from "enzyme";
import _ from "lodash";
import React from "react";

import { Correlations } from "../../popups/Correlations";
import { ReactColumnAnalysis } from "../../popups/analysis/ColumnAnalysis";
import { ReactCharts } from "../../popups/charts/Charts";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
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
  });

  test("Popup w/ ColumnAnalysis initial rendering", () => {
    const ReactPopup = require("../../popups/Popup").ReactPopup;

    const props = {
      dataId: "1",
      chartData: {
        visible: true,
        type: "column-analysis",
        title: "ColumnAnalysis Test",
        selectedCol: "foo",
      },
    };

    const result = shallow(<ReactPopup {...props} onClose={_.noop} />);
    const title = _.join(
      result
        .find("ModalTitle")
        .children()
        .map(n => n.text()),
      ""
    ).trim();
    t.equal(title, "Column Analysis for foo", "Should render correct title");
    t.ok(result.find("ColumnAnalysis").length, "should render column analysis canvas");
  });

  test("Popup w/ Correlations initial rendering", () => {
    const ReactPopup = require("../../popups/Popup").ReactPopup;

    const props = {
      dataId: "1",
      chartData: {
        visible: true,
        type: "correlations",
        title: "Correlations Test",
      },
    };

    const result = shallow(<ReactPopup {...props} onClose={_.noop} />);
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

  test("Popup w/ Charts initial rendering", () => {
    const ReactPopup = require("../../popups/Popup").ReactPopup;

    const props = {
      dataId: "1",
      chartData: {
        visible: true,
        type: "charts",
      },
    };

    const result = shallow(<ReactPopup {...props} onClose={_.noop} />);
    const title = _.join(
      result
        .find("ModalTitle")
        .children()
        .map(n => n.text()),
      ""
    ).trim();
    t.equal(title, "Chart Builder", "Should render correct title");
    t.ok(result.find("Charts").length, "should render charts chart canvas");
  });
});
