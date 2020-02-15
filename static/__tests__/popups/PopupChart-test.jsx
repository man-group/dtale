import { shallow } from "enzyme";
import _ from "lodash";
import React from "react";

import { ReactCorrelations } from "../../popups/Correlations";
import { ReactHistogram } from "../../popups/Histogram";
import { ReactCharts } from "../../popups/charts/Charts";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { withGlobalJquery } from "../test-utils";

class MockReactCorrelations extends React.Component {
  render() {
    return <ReactCorrelations dataId="1" />;
  }
}
MockReactCorrelations.displayName = "Correlations";

class MockReactHistogram extends React.Component {
  render() {
    return <ReactHistogram dataId="1" />;
  }
}
MockReactHistogram.displayName = "Histogram";

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
    jest.mock("../../popups/Histogram", () => ({
      Histogram: MockReactHistogram,
    }));
    jest.mock("../../popups/Correlations", () => ({
      Correlations: MockReactCorrelations,
    }));
    jest.mock("../../popups/charts/Charts", () => ({
      Charts: MockReactCharts,
    }));
  });

  test("Popup w/ Histogram initial rendering", () => {
    const ReactPopup = require("../../popups/Popup").ReactPopup;

    const props = {
      dataId: "1",
      chartData: {
        visible: true,
        type: "histogram",
        title: "Histogram Test",
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
    t.equal(title, "Histogram for foo", "Should render correct title");
    t.ok(result.find("Histogram").length, "should render histogram canvas");
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
