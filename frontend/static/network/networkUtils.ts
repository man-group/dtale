import { DataSet, FocusOptions, Network, Node, Options } from 'vis-network';

import {
  BaseNetworkDisplayState,
  NetworkClickParameters,
  NetworkDisplayComponentProps,
  NetworkDisplayState,
  NetworkNode,
} from './NetworkState';

export const BASE_LAYOUT = { randomSeed: '0.685932285174649:1620487071113' };
export const OPTIONS: Partial<Options> = {
  nodes: {
    shape: 'dot',
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
      face: 'Tahoma',
    },
  },
  edges: {
    smooth: {
      type: 'dynamic',
      roundness: 0,
      enabled: true,
    },
  },
  physics: false,
  interaction: {
    tooltipDelay: 200,
    hideEdgesOnDrag: true,
    hideEdgesOnZoom: true,
  },
};

export const ZOOM: FocusOptions = {
  offset: { x: 0, y: 0 },
  animation: { duration: 1000, easingFunction: 'easeInOutQuad' },
};

export const DBL_CLICK_THRESHOLD = 200;

export const resetNode = (node?: NetworkNode, color?: string): void => {
  if (node) {
    node.color = color;
    if (node.hiddenLabel !== undefined) {
      node.label = node.hiddenLabel;
      node.hiddenLabel = undefined;
    }
  }
};

export const neighborhoodHighlight = (
  state: Partial<NetworkDisplayState>,
  network: Network,
  params: NetworkClickParameters,
): boolean => {
  const { allNodes } = state;
  let highlightActive = state.highlightActive ?? false;
  const nodesDataset = (network as any).body.data.nodes as DataSet<Node>;
  // if something is selected:
  if (params.nodes.length > 0) {
    highlightActive = true;
    const selectedNodeId = params.nodes[0];

    // mark all nodes as hard to read.
    Object.values(allNodes ?? {}).forEach((node) => {
      node.color = 'rgba(200,200,200,0.5)';
      if (node.hiddenLabel === undefined) {
        node.hiddenLabel = node.label;
        node.label = undefined;
      }
    });

    network.getConnectedNodes(selectedNodeId).forEach((node) => {
      // all first degree nodes get their own color and their label back
      resetNode(allNodes?.[node as string]);
      network.getConnectedNodes(node as string).forEach((connectedNode) => {
        // all second degree nodes get a different color and their label back
        resetNode(allNodes?.[connectedNode as string], 'rgba(150,150,150,0.75)');
      });
    });

    // the main node gets its own color and its label back.
    resetNode(allNodes?.[selectedNodeId]);
  } else if (highlightActive === true) {
    // reset all nodes
    Object.values(allNodes ?? {}).forEach((node) => resetNode(node));
    highlightActive = false;
  }

  nodesDataset.update(Object.values(allNodes ?? {}) as Node[]);
  return highlightActive;
};

export const buildParams = (props: BaseNetworkDisplayState): Record<string, string> => {
  const { to, from, weight, group, color } = props;
  return {
    to: to?.value ?? '',
    from: from?.value ?? '',
    group: group?.value ?? '',
    weight: weight?.value ?? '',
    color: color?.value ?? '',
  };
};

export const buildState = (props?: NetworkDisplayComponentProps): NetworkDisplayState => ({
  loadingDtypes: true,
  loadingData: false,
  to: props?.to ? { value: props.to } : undefined,
  from: props?.from ? { value: props.from } : undefined,
  group: props?.group ? { value: props.group } : undefined,
  weight: props?.weight ? { value: props.weight } : undefined,
  color: props?.color ? { value: props.color } : undefined,
  shortestPath: [],
  arrows: { to: true, from: false },
  highlightActive: false,
});
