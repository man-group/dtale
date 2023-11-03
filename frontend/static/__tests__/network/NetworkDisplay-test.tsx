import { act, fireEvent, getByText, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { DataSet } from 'vis-data/standalone/umd/vis-data.min';
import { Edge, Node, Options } from 'vis-network/standalone/umd/vis-network.min';

import { NetworkClickParameters } from '../../network/NetworkState';
import { mockColumnDef } from '../mocks/MockColumnDef';
import { MockDataSet } from '../mocks/MockDataSet';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, selectOption, tick } from '../test-utils';

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
  let result: Element;
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
        data: { nodes: { update: () => undefined, destroy: () => undefined } },
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
    (axios.get as any).mockImplementation(async (url: string) => {
      if (url.startsWith('/dtale/dtypes')) {
        return Promise.resolve({
          data: {
            dtypes: [
              mockColumnDef({
                name: 'to',
                index: 0,
                dtype: 'object',
              }),
              mockColumnDef({
                name: 'from',
                index: 1,
                dtype: 'object',
              }),
              mockColumnDef({
                name: 'weight',
                index: 2,
                dtype: 'int64',
              }),
            ],
            success: true,
          },
        });
      } else if (url.startsWith('/dtale/network-data/1')) {
        const networkData = require('./data.json');
        return Promise.resolve({ data: networkData });
      } else if (url.startsWith('/dtale/shortest-path/1')) {
        return Promise.resolve({ data: { data: ['b', 'c'] } });
      } else if (url.startsWith('/dtale/network-analysis/1')) {
        return Promise.resolve({ data: { data: {} } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    const { NetworkDisplay } = require('../../network/NetworkDisplay');
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    result = await act(
      () =>
        render(
          <Provider store={store}>
            <NetworkDisplay {...params} />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  const buildNetwork = async (): Promise<void> => {
    const selects = Array.from(result.getElementsByClassName('Select'));
    await selectOption(selects[0] as HTMLElement, 'to');
    await selectOption(selects[1] as HTMLElement, 'from');
    await selectOption(selects[3] as HTMLElement, 'weight');
    await selectOption(selects[4] as HTMLElement, 'weight');
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('load-network')[0]);
    });
  };

  const clickShortestPath = async (node: string): Promise<void> => {
    await act(async () => {
      await getLatestNetwork().eventHandlers.click({ event: { srcEvent: { shiftKey: true } }, nodes: [node] });
    });
    await act(async () => {
      await tick(250);
    });
  };

  it('renders correctly', async () => {
    await buildDisplay();
    await buildNetwork();
    expect(screen.getByTestId('network-analysis')).toBeDefined();
    const groupLegend = result.getElementsByClassName('groups-legend')[0];
    const groups = Array.from(groupLegend.querySelectorAll('div.pl-3.d-inline')).map((g) => g.textContent);
    expect(groups).toHaveLength(6);
    expect(groups[5]).toBe('N/A');
    expect(groupLegend).toBeDefined();
    await act(async () => {
      await fireEvent.click(screen.getByText('Up-Down'));
    });
    expect(getLatestNetwork().options.layout.hierarchical.direction).toBe('UD');
    await act(async () => {
      await fireEvent.click(screen.getByText('Up-Down'));
    });
    expect(getLatestNetwork().options.layout.hierarchical).toBeUndefined();
  });

  it('handles arrow toggling', async () => {
    await buildDisplay();
    await buildNetwork();
    await act(async () => {
      await fireEvent.click(getByText(screen.getByTestId('arrow-toggle'), 'To'));
    });
    expect(getLatestNetwork().options.edges.arrows.to.enabled).toBe(false);
    await act(async () => {
      await fireEvent.click(getByText(screen.getByTestId('arrow-toggle'), 'From'));
    });
    expect(getLatestNetwork().options.edges.arrows.from.enabled).toBe(true);
  });

  it('correctly displays collapsible instructions', async () => {
    await buildDisplay();
    expect(screen.getByTestId('network-description')).toBeDefined();
    await act(async () => {
      await fireEvent.click(screen.getByTestId('network-description').getElementsByTagName('dd')[0]);
    });
    const title = screen.getByTestId('network-description').getElementsByTagName('h3')[0];
    expect(title.textContent).toBe('Example Data');
  });

  it('builds shortest path', async () => {
    await buildDisplay();
    await buildNetwork();
    await clickShortestPath('b');
    await clickShortestPath('c');
    const shortestPath = result.getElementsByClassName('shortest-path')[0];
    expect(shortestPath.textContent).toBe('Shortest path between nodes b & c: b -> c');
    await act(async () => {
      await fireEvent.click(shortestPath.getElementsByTagName('i')[0]);
    });
    expect(result.getElementsByClassName('shortest-path')).toHaveLength(0);
  });

  it('builds network analysis', async () => {
    await buildDisplay();
    await buildNetwork();
    await act(async () => {
      await fireEvent.click(screen.getByTestId('network-analysis').getElementsByTagName('dd')[0]);
    });
    expect(result.querySelectorAll('div.network-analysis').length).toBe(8);
  });

  it('builds network analysis with parameters', async () => {
    await buildDisplay({
      to: 'to',
      from: 'from',
      group: 'weight',
      weight: 'weight',
    });
    const selects = result.getElementsByClassName('Select');
    expect(selects[0].getElementsByClassName('Select__single-value')[0].textContent).toBe('to');
    expect(selects[1].getElementsByClassName('Select__single-value')[0].textContent).toBe('from');
    expect(screen.getByTestId('network-analysis')).toBeDefined();
  });
});
