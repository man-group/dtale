import _ from "lodash";
import vis from "vis-network/dist/vis-network";

import { expect, it } from "@jest/globals";

import * as networkUtils from "../../network/networkUtils";

describe("NetworkDisplay test", () => {
  it("neighborhoodHighlight", () => {
    const networkData = require("./data.json");
    const nodesDataset = new vis.DataSet(networkData.nodes);
    const allNodes = nodesDataset.get({ returnType: "Object" });
    const node1 = networkData.nodes[0].id;
    const node2 = networkData.nodes[1].id;
    const node3 = networkData.nodes[2].id;
    const network = {
      getConnectedNodes: nodeId => (nodeId === node1 ? [node2] : [node3]),
      update: () => undefined,
      body: { data: { nodes: nodesDataset } },
    };
    expect(allNodes[node3].color).toBeUndefined();
    let output = networkUtils.neighborhoodHighlight({ allNodes, highlightActive: false }, network, { nodes: [node1] });
    expect(_.has(allNodes[node1], "color")).toBe(true);
    expect(allNodes[node3].color).toBe("rgba(150,150,150,0.75)");

    expect(output).toBe(true);
    output = networkUtils.neighborhoodHighlight({ allNodes, highlightActive: true }, network, { nodes: [] });
    expect(output).toBe(false);
    expect(allNodes[node3].color).toBeUndefined();
  });
});
