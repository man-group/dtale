import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import {
  buildInnerHTML,
  clickMainMenuButton,
  mockChartJS,
  mockT as t,
  tick,
  tickUpdate,
  withGlobalJquery,
} from "../../test-utils";

import { clickBuilder } from "./create-test-utils";

function submit(res) {
  res.find("div.modal-footer").first().find("button").first().simulate("click");
}

describe("DataViewer tests", () => {
  let result, CreateColumn, CreateTypeConversion;

  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher, DTYPES } = require("../../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/dtypes")) {
          return {
            dtypes: _.concat(DTYPES.dtypes, {
              name: "col5",
              index: 4,
              dtype: "mixed-integer",
              visible: true,
              unique_ct: 1,
            }),
            success: true,
          };
        }
        return urlFetcher(url);
      })
    );

    mockChartJS();

    jest.mock("popsicle", () => mockBuildLibs);
  });

  beforeEach(async () => {
    CreateTypeConversion = require("../../../popups/create/CreateTypeConversion").default;
    CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;
    const { DataViewer } = require("../../../dtale/DataViewer");

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tick();
    clickMainMenuButton(result, "Dataframe Functions");
    await tickUpdate(result);
    result
      .find(CreateColumn)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "conv_col" } });
    clickBuilder(result, "Type Conversion");
  });

  afterEach(() => {
    result.unmount();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build int conversion column", async () => {
    expect(result.find(CreateTypeConversion).length).toBe(1);
    result.find(CreateTypeConversion).find(Select).first().props().onChange({ value: "col1" });
    result.update();
    result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").last().simulate("click");
    result.update();
    result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
    result.update();
    result.find(CreateTypeConversion).find(Select).at(1).props().onChange({ value: "YYYYMMDD" });
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      to: "date",
      from: "int64",
      col: "col1",
      unit: "YYYYMMDD",
      fmt: null,
      applyAllType: false,
    });
  });

  it("DataViewer: build float conversion column", async () => {
    result.find(CreateTypeConversion).find(Select).first().props().onChange({ value: "col2" });
    result.update();
    result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").last().simulate("click");
    result.update();
    result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col2",
      to: "int",
      from: "float64",
      fmt: null,
      unit: null,
      applyAllType: false,
    });
  });

  it("DataViewer: build string conversion column", async () => {
    result.find(CreateTypeConversion).find(Select).first().props().onChange({ value: "col3" });
    result.update();
    result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
    result
      .find(CreateTypeConversion)
      .find("div.form-group")
      .at(2)
      .find("input")
      .first()
      .simulate("change", { target: { value: "%d/%m/%Y" } });
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col3",
      to: "date",
      from: "object",
      fmt: "%d/%m/%Y",
      unit: null,
      applyAllType: false,
    });
  });

  it("DataViewer: build mixed conversion column", async () => {
    result.find(CreateColumn).find("div.form-group").first().find("button").first().simulate("click");
    result.find(CreateTypeConversion).find(Select).first().props().onChange({ value: "col5" });
    result.update();
    result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
    result.find(CreateTypeConversion).find("i.ico-check-box-outline-blank").simulate("click");
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col5",
      fmt: null,
      unit: null,
      to: "date",
      from: "mixed-integer",
      applyAllType: true,
    });
  });

  it("DataViewer: build date conversion column", async () => {
    result.find(CreateTypeConversion).find(Select).first().props().onChange({ value: "col4" });
    result.update();
    result.find(CreateTypeConversion).find("div.form-group").at(1).find("button").first().simulate("click");
    result.update();
    result.find(CreateTypeConversion).find(Select).at(1).props().onChange({ value: "ms" });
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col4",
      to: "int",
      from: "datetime64[ns]",
      unit: "ms",
      fmt: null,
      applyAllType: false,
    });
  });

  it("DataViewer: build conversion cfg validation", () => {
    const { validateTypeConversionCfg } = require("../../../popups/create/CreateTypeConversion");
    expect(validateTypeConversionCfg(t, { col: null })).toBe("Missing a column selection!");
    expect(validateTypeConversionCfg(t, { col: "col1", to: null })).toBe("Missing a conversion selection!");
    expect(
      validateTypeConversionCfg(t, {
        col: "col2",
        to: "date",
        from: "int64",
        unit: null,
      })
    ).toBe("Missing a unit selection!");
    expect(
      validateTypeConversionCfg(t, {
        col: "col2",
        to: "int",
        from: "datetime64[ns]",
        unit: "D",
      })
    ).toBe("Invalid unit selection, valid options are 'YYYYMMDD' or 'ms'");
    expect(
      validateTypeConversionCfg(t, {
        col: "col2",
        to: "int",
        from: "datetime64[ns]",
        unit: "ms",
      })
    ).toBeNull();
  });
});
