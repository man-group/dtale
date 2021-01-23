import _ from "lodash";

export const BASE_LAYOUT = { randomSeed: 2 };
export const OPTIONS = {
  nodes: {
    shape: "dot",
    scaling: {
      min: 10,
      max: 30,
      label: {
        min: 8,
        max: 30,
        drawThreshold: 12,
        maxVisible: 20,
      },
    },
    font: {
      size: 12,
      face: "Tahoma",
    },
  },
  edges: {
    smooth: {
      type: "continuous",
    },
    arrows: {
      to: { enabled: true },
    },
  },
  physics: false,
  interaction: {
    tooltipDelay: 200,
    hideEdgesOnDrag: true,
    hideEdgesOnZoom: true,
  },
};
export const ZOOM = {
  offset: { x: 0, y: 0 },
  animation: { duration: 1000, easingFunction: "easeInOutQuad" },
};
export const DBL_CLICK_THRESHOLD = 200;

export const resetNode = (node, color = undefined) => {
  node.color = color;
  if (node.hiddenLabel !== undefined) {
    node.label = node.hiddenLabel;
    node.hiddenLabel = undefined;
  }
};

export const neighborhoodHighlight = ({ allNodes, highlightActive }, network, { nodes }) => {
  const nodesDataset = network.body.data.nodes;
  // if something is selected:
  if (nodes.length > 0) {
    highlightActive = true;
    const selectedNodeId = nodes[0];

    // mark all nodes as hard to read.
    _.forEach(allNodes, node => {
      node.color = "rgba(200,200,200,0.5)";
      if (node.hiddenLabel === undefined) {
        node.hiddenLabel = node.label;
        node.label = undefined;
      }
    });
    const connectedNodes = network.getConnectedNodes(selectedNodeId);
    let allConnectedNodes = [];

    // get the second degree nodes
    _.forEach(connectedNodes, node => (allConnectedNodes = allConnectedNodes.concat(network.getConnectedNodes(node))));

    // all second degree nodes get a different color and their label back
    _.forEach(allConnectedNodes, connectedNode => resetNode(allNodes[connectedNode], "rgba(150,150,150,0.75)"));

    // all first degree nodes get their own color and their label back
    _.forEach(connectedNodes, connectedNode => resetNode(allNodes[connectedNode]));

    // the main node gets its own color and its label back.
    resetNode(allNodes[selectedNodeId]);
  } else if (highlightActive === true) {
    // reset all nodes
    _.forEach(allNodes, node => resetNode(node));
    highlightActive = false;
  }

  nodesDataset.update(_.values(allNodes));
  return highlightActive;
};
