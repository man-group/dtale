import { shallow } from "enzyme";
import _ from "lodash";
import React from "react";

import { ReactCorrelations } from "../../popups/Correlations";
import { ReactHistogram } from "../../popups/Histogram";
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
  });

  test("Popup w/ Histogram initial rendering", () => {
    const ReactPopup = require("../../popups/Popup").ReactPopup;

    const props = {
      dataId: "1",
      chartData: { visible: true, type: "histogram", title: "Histogram Test" },
    };

    const result = shallow(<ReactPopup {...props} onClose={_.noop} />);
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
});
