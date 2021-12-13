import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider, ProviderProps } from 'react-redux';
import { DataSet } from 'vis-data/standalone/umd/vis-data.min';
import { Edge, Node, Options } from 'vis-network/standalone/umd/vis-network.min';

import { NetworkClickParameters } from '../../network/NetworkState';
import ColumnSelect from '../../popups/create/ColumnSelect';
import * as GenericRepository from '../../repository/GenericRepository';
import { MockDataSet } from '../mocks/MockDataSet';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../test-utils';

/** Properties for vis-network dataset parameter */
interface NetworkDataset {
  nodes: DataSet<Node>;
  edges: DataSet<Edge>;
}

/** Properties for vis-network body */
interface NetworkBody {
  data: Record<string, unknown>;
  nodes: Record<string, unknown>;
}

describe('NetworkDisplay test', () => {
  let result: ReactWrapper<ProviderProps>;
  const networkSpy: jest.Mock<(network: MockNetwork) => void> = jest.fn();

  /** Mocked vis-network Network */
  class MockNetwork {
    public dataset: NetworkDataset;
    public options: Options;
    public body: NetworkBody;
    public eventHandlers: Record<string, (params: NetworkClickParameters) => void> = {};

    /** @override */
    constructor(container: HTMLDivElement, dataset: NetworkDataset, options: Options) {
      this.dataset = dataset;
      this.options = options;
      this.body = {
        data: { nodes: { update: () => undefined } },
        nodes: {},
      };
      networkSpy(this);
    }

    /**
     * Mocked getConnectedNodes
     *
     * @return connected nodes
     */
    public getConnectedNodes(): [] {
      return [];
    }

    /**
     * Mocked "on" function for vis-network. Stores event handlers on instance
     *
     * @param event event to handle
     * @param func handler for event
     */
    public on(event: string, func: (params: NetworkClickParameters) => void): void {
      this.eventHandlers[event] = func;
    }
  }

  beforeAll(() => {
    const crypto = require('crypto');

    Object.defineProperty(global.self, 'crypto', {
      value: { getRandomValues: (arr: []) => crypto.randomBytes(arr.length) },
    });

    jest.mock('vis-data/standalone/umd/vis-data.min', () => ({ DataSet: MockDataSet }));
    jest.mock('vis-network/standalone/umd/vis-network.min', () => ({ Network: MockNetwork }));
  });

  afterAll(jest.restoreAllMocks);

  const getLatestNetwork = (): any => networkSpy.mock.calls[networkSpy.mock.calls.length - 1][0];

  const buildDisplay = async (params = {}): Promise<void> => {
    const getDataFromServiceSpy = jest.spyOn(GenericRepository, 'getDataFromService');
    getDataFromServiceSpy.mockImplementation((url) => {
      if (url.startsWith('/dtale/network-data/1')) {
        const networkData = require('./data.json');
        return networkData;
      } else if (url.startsWith('/dtale/shortest-path/1')) {
        return { data: ['b', 'c'] };
      } else if (url.startsWith('/dtale/network-analysis/1')) {
        return { data: {} };
      }
      return undefined;
    });
    const { NetworkDisplay } = require('../../network/NetworkDisplay');
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store as any);
    result = mount(
      <Provider store={store}>
        <NetworkDisplay {...params} />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
  };

  const buildNetwork = async (): Promise<void> => {
    const comp = result.find('ReactNetworkDisplay');
    const selects = comp.find(ColumnSelect);
    await act(async () => {
      selects.first().prop('updateState')({ to: { value: 'to' } });
      selects.at(2).prop('updateState')({ from: { value: 'from' } });
      selects.at(3).prop('updateState')({ group: { value: 'weight' } });
      selects.last().prop('updateState')({ weight: { value: 'weight' } });
    });
    result = result.update();
    await act(async () => {
      comp.find('button').first().simulate('click');
    });
    result = result.update();
  };

  const clickShortestPath = async (node: string): Promise<void> => {
    getLatestNetwork().eventHandlers.click({ event: { srcEvent: { shiftKey: true } }, nodes: [node] });
    await tickUpdate(result, 200);
  };

  it('renders correctly', async () => {
    await buildDisplay();
    await buildNetwork();
    const comp = result.find('ReactNetworkDisplay');
    expect(comp.find('NetworkAnalysis')).toHaveLength(1);
    expect(comp.state('groups')).toHaveLength(6);
    expect(comp.state('groups')[5][0]).toBe('N/A');
    expect(comp.find('GroupsLegend').html()).not.toBeNull();
    result.find('HierarchyToggle').find('button').first().simulate('click');
    expect(getLatestNetwork().options.layout.hierarchical.direction).toBe('UD');
    result.find('HierarchyToggle').find('button').first().simulate('click');
    expect(getLatestNetwork().options.layout.hierarchical).toBeUndefined();
  });

  it('handles arrow toggling', async () => {
    await buildDisplay();
    await buildNetwork();
    result.find('ArrowToggle').find('button').first().simulate('click');
    expect(getLatestNetwork().options.edges.arrows.to.enabled).toBe(false);
    result.find('ArrowToggle').find('button').last().simulate('click');
    expect(getLatestNetwork().options.edges.arrows.from.enabled).toBe(true);
  });

  it('correctly displays collapsible instructions', async () => {
    await buildDisplay();
    expect(result.find('NetworkDescription').length).toBe(1);
    result.find('NetworkDescription').find('Collapsible').find('dd').simulate('click');
    const title = result.find('NetworkDescription').find('Collapsible').find('h3');
    expect(title.text()).toBe('Example Data');
  });

  it('builds shortest path', async () => {
    await buildDisplay();
    await buildNetwork();
    await clickShortestPath('b');
    await clickShortestPath('c');
    const comp = result.find('ReactNetworkDisplay');
    await act(async () => {
      comp.setState({ shortestPath: ['b', 'c'] });
    });
    result = result.update();
    expect(result.find('ShortestPath').text()).toBe('Shortest path between nodes b & c: b -> c');
    await act(async () => {
      result.find('ShortestPath').find('i').simulate('click');
    });
    result = result.update();
    expect(result.find('ShortestPath').html()).toBeNull();
  });

  it('builds network analysis', async () => {
    await buildDisplay();
    await buildNetwork();
    await act(async () => {
      result.find('NetworkAnalysis').find('Collapsible').find('dd').simulate('click');
      await tickUpdate(result);
    });
    result = result.update();
    expect(result.find('NetworkAnalysis').find('div.network-analysis').length).toBe(8);
  });

  it('builds network analysis with parameters', async () => {
    await buildDisplay({
      to: 'to',
      from: 'from',
      group: 'weight',
      weight: 'weight',
    });
    expect(result.find('ReactNetworkDisplay').state()).toMatchObject({
      to: { value: 'to' },
      from: { value: 'from' },
    });
    expect(result.find('NetworkAnalysis')).toHaveLength(1);
  });
});
