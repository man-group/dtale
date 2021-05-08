import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

describe("NetworkDisplay test", () => {
  let result;

  beforeAll(() => {
    const crypto = require("crypto");

    Object.defineProperty(global.self, "crypto", {
      value: { getRandomValues: arr => crypto.randomBytes(arr.length) },
    });
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        if (_.startsWith(url, "/dtale/network-data/1")) {
          const networkData = require("./data.json");
          return networkData;
        } else if (_.startsWith(url, "/dtale/shortest-path/1")) {
          return { data: ["b", "c"] };
        } else if (_.startsWith(url, "/dtale/network-analysis/1")) {
          return { data: {} };
        }
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
    const network = {
      body: {
        data: { nodes: { update: () => undefined } },
        nodes: {},
      },
      getConnectedNodes: () => [],
    };
    network.on = (event, func) => {
      network[event] = func;
    };
    jest.mock("vis-network/dist/vis-network", () => ({
      DataSet: () => ({
        get: () => ({ b: { label: "b" }, c: { label: "c" } }),
      }),
      Network: (_container, dataset, options) => {
        network.dataset = dataset;
        network.options = options;
        return network;
      },
    }));
  });

  const buildDisplay = async (params = {}) => {
    const { NetworkDisplay } = require("../../network/NetworkDisplay");
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <NetworkDisplay {...params} />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tickUpdate(result);
  };

  const buildNetwork = async () => {
    const comp = result.find("ReactNetworkDisplay");
    const selects = comp.find("ColumnSelect");
    selects.first().prop("updateState")({ to: { value: "to" } });
    selects.at(2).prop("updateState")({ from: { value: "from" } });
    selects.at(3).prop("updateState")({ group: { value: "weight" } });
    selects.last().prop("updateState")({ weight: { value: "weight" } });
    comp.find("button").first().simulate("click");
    await tickUpdate(result);
  };

  const clickShortestPath = async node => {
    const comp = result.find("ReactNetworkDisplay");
    const network = comp.instance().network;
    network.click({ event: { srcEvent: { shiftKey: true } }, nodes: [node] });
    await tickUpdate(result, 200);
  };

  it("renders correctly", async () => {
    await buildDisplay();
    await buildNetwork();
    const comp = result.find("ReactNetworkDisplay");
    expect(comp.instance().network).toBeDefined();
    expect(comp.state("groups")).toHaveLength(6);
    expect(comp.state("groups")[5][0]).toBe("N/A");
    expect(comp.find("GroupsLegend").html()).not.toBeNull();
    result.find("HierarchyToggle").find("button").first().simulate("click");
    expect(comp.instance().network.options.layout.hierarchical.direction).toBe("UD");
    result.find("HierarchyToggle").find("button").first().simulate("click");
    expect(comp.instance().network.options.layout.hierarchical).toBeUndefined();
  });

  it("handles arrow toggling", async () => {
    await buildDisplay();
    await buildNetwork();
    const comp = result.find("ReactNetworkDisplay");
    result.find("ArrowToggle").find("button").first().simulate("click");
    expect(comp.instance().network.options.edges.arrows.to.enabled).toBe(false);
    result.find("ArrowToggle").find("button").last().simulate("click");
    expect(comp.instance().network.options.edges.arrows.from.enabled).toBe(true);
  });

  it("correctly displays collapsible instructions", async () => {
    await buildDisplay();
    expect(result.find("NetworkDescription").length).toBe(1);
    result.find("NetworkDescription").find("Collapsible").find("dd").simulate("click");
    const title = result.find("NetworkDescription").find("Collapsible").find("h3");
    expect(title.text()).toBe("Example Data");
  });

  it("builds shortest path", async () => {
    await buildDisplay();
    await buildNetwork();
    await clickShortestPath("b");
    await clickShortestPath("c");
    const comp = result.find("ReactNetworkDisplay");
    comp.setState({ shortestPath: ["b", "c"] });
    await tickUpdate(result);
    expect(result.find("ReactShortestPath").text()).toBe("Shortest path between nodes b & c: b -> c");
    result.find("ReactShortestPath").find("i").simulate("click");
    expect(result.find("ReactShortestPath").html()).toBeNull();
  });

  it("builds network analysis", async () => {
    await buildDisplay();
    await buildNetwork();
    result.find("ReactNetworkAnalysis").find("Collapsible").find("dd").simulate("click");
    await tickUpdate(result);
    expect(result.find("ReactNetworkAnalysis").find("div.network-analysis").length).toBe(8);
  });

  it("builds network analysis with parameters", async () => {
    await buildDisplay({
      to: "to",
      from: "from",
      group: "weight",
      weight: "weight",
    });
    expect(result.find("ReactNetworkDisplay").state()).toMatchObject({
      to: { value: "to" },
      from: { value: "from" },
    });
    expect(result.find("ReactNetworkDisplay").instance().network).toBeDefined();
  });
});
