import { DataSet } from 'vis-data';
import { Network } from 'vis-network';

import * as networkUtils from '../../network/networkUtils';

describe('NetworkDisplay test', () => {
  it('neighborhoodHighlight', () => {
    const networkData = require('./data.json');
    const nodesDataset = new DataSet<{ group: string; id: number; label: string }, 'id'>(networkData.nodes);
    const allNodes = nodesDataset.get({ returnType: 'Object' });
    const node1 = networkData.nodes[0].id;
    const node2 = networkData.nodes[1].id;
    const node3 = networkData.nodes[2].id;
    const network = {
      getConnectedNodes: (nodeId: string): any[] => (nodeId === node1 ? [node2] : [node3]),
      update: () => undefined,
      body: { data: { nodes: nodesDataset } },
    } as any as Network;
    expect((allNodes[node3] as any).color).toBeUndefined();
    let output = networkUtils.neighborhoodHighlight({ allNodes, highlightActive: false }, network, { nodes: [node1] });
    expect((allNodes[node3] as any).color).toBe('rgba(150,150,150,0.75)');

    expect(output).toBe(true);
    output = networkUtils.neighborhoodHighlight({ allNodes, highlightActive: true }, network, { nodes: [] });
    expect(output).toBe(false);
    expect((allNodes[node3] as any).color).toBeUndefined();
  });
});
