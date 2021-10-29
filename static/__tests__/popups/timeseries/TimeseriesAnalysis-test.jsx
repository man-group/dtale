import qs from "querystring";

import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import * as fetcher from "../../../fetcher";
import { BKFilter } from "../../../popups/timeseries/BKFilter";
import { BaseInputs } from "../../../popups/timeseries/BaseInputs";
import { CFFilter } from "../../../popups/timeseries/CFFilter";
import { HPFilter } from "../../../popups/timeseries/HPFilter";
import { ReactReports } from "../../../popups/timeseries/Reports";
import { SeasonalDecompose } from "../../../popups/timeseries/SeasonalDecompose";

describe("TimeseriesAnalysis", () => {
  let fetchJsonSpy;
  let wrapper;
  let props;

  beforeEach(() => {
    fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    fetchJsonSpy.mockImplementation(() => undefined);
    props = { dataId: "1", pythonVersion: [3, 8, 0], hideSidePanel: jest.fn() };
    wrapper = shallow(<ReactReports {...props} />);
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it("renders successfully", () => {
    expect(wrapper.find(BaseInputs)).toHaveLength(1);
    expect(wrapper.find(HPFilter)).toHaveLength(1);
    expect(fetchJsonSpy.mock.calls[0][0].startsWith("/dtale/dtypes/1")).toBe(true);
  });

  it("renders report inputs successfully", () => {
    wrapper.setState({ type: "bkfilter" });
    expect(wrapper.find(BKFilter)).toHaveLength(1);
    wrapper.setState({ type: "cffilter" });
    expect(wrapper.find(CFFilter)).toHaveLength(1);
    wrapper.setState({ type: "seasonal_decompose" });
    expect(wrapper.find(SeasonalDecompose)).toHaveLength(1);
    wrapper.setState({ type: "stl" });
    expect(wrapper.find(SeasonalDecompose)).toHaveLength(1);
  });

  describe("validate report builder", () => {
    beforeEach(() => {
      wrapper.find(BaseInputs).props().updateState({ col: "col1", index: "index" });
    });

    it("bkfilter", () => {
      wrapper.setState({ type: "bkfilter" });
      wrapper
        .find(BKFilter)
        .props()
        .updateState({ cfg: { low: 6, high: 32, K: 12 } });
      const { code, url } = wrapper.state();
      expect(code.bkfilter).toBeDefined();
      expect(url.startsWith("/dtale/timeseries-analysis/1")).toBe(true);
      const urlParams = qs.parse(url.split("?")[1]);
      expect(urlParams.type).toBe("bkfilter");
    });

    it("hpfilter", () => {
      wrapper
        .find(HPFilter)
        .props()
        .updateState({ cfg: { lamb: 1600 } });
      const { code, url } = wrapper.state();
      expect(code.hpfilter).toBeDefined();
      const urlParams = qs.parse(url.split("?")[1]);
      expect(urlParams.type).toBe("hpfilter");
    });

    it("cffilter", () => {
      wrapper.setState({ type: "cffilter" });
      wrapper
        .find(CFFilter)
        .props()
        .updateState({ cfg: { low: 6, high: 32, drift: true } });
      const { code, url } = wrapper.state();
      expect(code.cffilter).toBeDefined();
      const urlParams = qs.parse(url.split("?")[1]);
      expect(urlParams.type).toBe("cffilter");
    });

    it("seasonal_decompose", () => {
      wrapper.setState({ type: "seasonal_decompose" });
      wrapper
        .find(SeasonalDecompose)
        .props()
        .updateState({ cfg: { model: "additive" } });
      const { code, url } = wrapper.state();
      expect(code.seasonal_decompose).toBeDefined();
      const urlParams = qs.parse(url.split("?")[1]);
      expect(urlParams.type).toBe("seasonal_decompose");
    });

    it("stl", () => {
      wrapper.setState({ type: "stl" });
      wrapper.find(SeasonalDecompose).props().updateState({ cfg: {} });
      const { code, url } = wrapper.state();
      expect(code.stl).toBeDefined();
      const urlParams = qs.parse(url.split("?")[1]);
      expect(urlParams.type).toBe("stl");
    });
  });

  describe("report errors", () => {
    beforeEach(() => {
      wrapper.find(BaseInputs).props().updateState({});
      expect(wrapper.state().error.props.error).toBe("Missing an index selection!");
      wrapper.find(BaseInputs).props().updateState({ index: "index" });
      expect(wrapper.state().error.props.error).toBe("Missing a column selection!");
      wrapper.find(BaseInputs).props().updateState({ col: "col1", index: "index" });
    });

    it("bkfilter", () => {
      wrapper.setState({ type: "bkfilter" });
      const { updateState } = wrapper.find(BKFilter).props();
      updateState({ cfg: {} });
      expect(wrapper.state().error.props.error).toBe("Please enter a low!");
      updateState({ cfg: { low: 6 } });
      expect(wrapper.state().error.props.error).toBe("Please enter a high!");
      updateState({ cfg: { low: 6, high: 32 } });
      expect(wrapper.state().error.props.error).toBe("Please enter K!");
    });

    it("hpfilter", () => {
      const { updateState } = wrapper.find(HPFilter).props();
      updateState({ cfg: {} });
      expect(wrapper.state().error.props.error).toBe("Please enter a lambda!");
    });

    it("cffilter", () => {
      wrapper.setState({ type: "cffilter" });
      const { updateState } = wrapper.find(CFFilter).props();
      updateState({ cfg: {} });
      expect(wrapper.state().error.props.error).toBe("Please enter a low!");
      updateState({ cfg: { low: 6 } });
      expect(wrapper.state().error.props.error).toBe("Please enter a high!");
    });
  });
});
