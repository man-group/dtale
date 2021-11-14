import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { chartConfig, SeasonalDecompose } from "../../../popups/timeseries/SeasonalDecompose";

describe("SeasonalDecompose", () => {
  let wrapper, props;

  beforeEach(() => {
    props = {
      baseCfg: {},
      cfg: {},
      type: "seasonal_decompose",
      updateState: jest.fn(),
    };
    wrapper = shallow(<SeasonalDecompose {...props} />);
  });

  it("renders successfully", () => {
    expect(wrapper.find("div.col-md-4")).toHaveLength(1);
    expect(props.updateState).toHaveBeenCalledTimes(1);
  });

  it("updates state", () => {
    wrapper.find("button").last().simulate("click");
    expect(props.updateState).toHaveBeenLastCalledWith({
      cfg: { model: "multiplicative" },
    });
  });

  it("updates state on baseCfg update", () => {
    props.updateState.mockReset();
    wrapper.setProps({ baseCfg: { col: "foo" } });
    expect(props.updateState).toHaveBeenCalledTimes(1);
  });

  it("builds chart config correctly", () => {
    const cfg = chartConfig(
      { col: "foo" },
      {
        data: { datasets: [{}, {}, {}, {}] },
        options: {
          scales: {
            "y-cycle": {},
            "y-seasonal": { title: {} },
            "y-resid": {},
            "y-trend": {},
            "y-foo": { title: {} },
            x: { title: { display: false } },
          },
          plugins: {},
        },
      }
    );
    expect(cfg.options.scales["y-foo"].position).toBe("left");
    expect(cfg.options.scales["y-foo"].title.text).toBe("foo, trend");
    expect(cfg.options.scales["y-seasonal"].title.text).toBe("seasonal, resid");
    expect(cfg.options.scales["y-seasonal"].position).toBe("right");
    expect(cfg.options.scales["y-trend"].display).toBe(false);
    expect(cfg.options.scales["y-resid"].display).toBe(false);
    expect(cfg.options.plugins.legend.display).toBe(true);
  });

  describe("stl", () => {
    beforeEach(() => {
      jest.resetAllMocks();
      wrapper.setProps({ type: "stl" });
    });

    it("renders successfully", () => {
      expect(wrapper.find("div.col-md-4")).toHaveLength(0);
      expect(props.updateState).toHaveBeenCalledTimes(1);
    });

    it("builds chart config correctly", () => {
      const cfg = chartConfig(
        { col: "foo" },
        {
          data: { datasets: [{}, {}, {}, {}] },
          options: {
            scales: {
              "y-cycle": {},
              "y-seasonal": { title: {} },
              "y-resid": {},
              "y-trend": {},
              "y-foo": { title: {} },
              x: { title: { display: false } },
            },
            plugins: {},
          },
        }
      );
      expect(cfg.options.scales["y-foo"].position).toBe("left");
      expect(cfg.options.scales["y-foo"].title.text).toBe("foo, trend");
      expect(cfg.options.scales["y-seasonal"].title.text).toBe("seasonal, resid");
      expect(cfg.options.scales["y-seasonal"].position).toBe("right");
      expect(cfg.options.scales["y-trend"].display).toBe(false);
      expect(cfg.options.scales["y-resid"].display).toBe(false);
      expect(cfg.options.plugins.legend.display).toBe(true);
    });
  });
});
