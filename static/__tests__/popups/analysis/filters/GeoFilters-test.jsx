import { mount } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import GeoFilters from "../../../../popups/analysis/filters/GeoFilters";

describe("GeoFilters tests", () => {
  let result, update;

  beforeEach(() => {
    update = jest.fn();
    const props = {
      col: "lat",
      columns: [
        { name: "lat", coord: "lat" },
        { name: "lon", coord: "lon" },
        { name: "lat2", coord: "lat" },
        { name: "lat3", coord: "lat" },
        { name: "lon2", coord: "lon" },
      ],
      update,
      latCol: { value: "lat" },
      lonCol: { value: "lon" },
    };
    result = mount(<GeoFilters {...props} />);
  });

  it("renders longitude dropdown", () => {
    expect(result.find("FilterSelect").length).toBe(1);
    result.find("FilterSelect").prop("selectProps").onChange({ value: "lon2" });
    expect(update).toHaveBeenLastCalledWith({ lonCol: { value: "lon2" } });
  });

  it("renders latitude dropdown", () => {
    result.setProps({ col: "lon" });
    expect(result.find("FilterSelect").length).toBe(1);
    result.find("FilterSelect").prop("selectProps").onChange({ value: "lat2" });
    expect(update).toHaveBeenLastCalledWith({ latCol: { value: "lat2" } });
  });

  it("renders text", () => {
    result.setProps({
      columns: [
        { name: "lat", coord: "lat" },
        { name: "lon", coord: "lon" },
      ],
    });
    expect(result.text()).toBe("Latitude:latLongitude:lon");
  });
});
