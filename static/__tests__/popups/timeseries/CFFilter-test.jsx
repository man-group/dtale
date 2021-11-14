import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { CFFilter, chartConfig } from "../../../popups/timeseries/CFFilter";

describe("CFFilter", () => {
  let wrapper, props;

  beforeEach(() => {
    props = {
      baseCfg: {},
      cfg: {},
      updateState: jest.fn(),
    };
    wrapper = shallow(<CFFilter {...props} />);
  });

  it("renders successfully", () => {
    expect(wrapper.find("div.col-md-4")).toHaveLength(3);
    expect(props.updateState).toHaveBeenCalledTimes(1);
  });

  it("updates state", () => {
    wrapper.find("input").forEach(input => {
      input.simulate("change", { target: { value: 5 } });
      input.simulate("keyDown", { key: "Enter" });
    });
    wrapper.find("i").simulate("click");
    expect(props.updateState).toHaveBeenLastCalledWith({
      cfg: { low: 5, high: 5, drift: true },
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
        data: { datasets: [{}, {}, {}] },
        options: {
          scales: {
            "y-cycle": {},
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
    expect(cfg.options.scales["y-cycle"].position).toBe("right");
    expect(cfg.options.scales["y-trend"].display).toBe(false);
    expect(cfg.options.plugins.legend.display).toBe(true);
  });
});
