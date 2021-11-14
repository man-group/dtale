import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { BKFilter, chartConfig } from "../../../popups/timeseries/BKFilter";

describe("BKFilter", () => {
  let wrapper, props;

  beforeEach(() => {
    props = {
      baseCfg: {},
      cfg: {},
      updateState: jest.fn(),
    };
    wrapper = shallow(<BKFilter {...props} />);
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
    expect(props.updateState).toHaveBeenLastCalledWith({
      cfg: { low: 5, high: 5, K: 5 },
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
        data: { datasets: [{}, {}] },
        options: {
          scales: {
            "y-cycle": {},
            "y-foo": {},
            x: { title: { display: false } },
          },
          plugins: {},
        },
      }
    );
    expect(cfg.options.scales["y-foo"].position).toBe("left");
    expect(cfg.options.scales["y-cycle"].position).toBe("right");
    expect(cfg.options.plugins.legend.display).toBe(true);
  });
});
