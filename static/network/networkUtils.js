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
