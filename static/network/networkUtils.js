import _ from "lodash";

export const BASE_LAYOUT = { randomSeed: "0.685932285174649:1620487071113" };
export const OPTIONS = {
  nodes: {
    shape: "dot",
    size: 10,
    scaling: {
      label: {
        min: 8,
        max: 30,
        drawThreshold: 8,
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
      type: "dynamic",
      roundness: 0,
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

export function buildParams({ to, from, weight, group, color }) {
  return {
    to: to?.value,
    from: from?.value,
    group: group?.value,
    weight: weight?.value,
    color: color?.value,
  };
}

export function buildState(props = {}) {
  return {
    error: null,
    loadingData: false,
    dtypes: null,
    to: props.to ? { value: props.to } : null,
    from: props.from ? { value: props.from } : null,
    group: props.group ? { value: props.group } : null,
    weight: props.weight ? { value: props.weight } : null,
    color: props.color ? { value: props.color } : null,
    hierarchy: null,
    groups: null,
    shortestPath: [],
    arrows: { to: true, from: false },
  };
}
