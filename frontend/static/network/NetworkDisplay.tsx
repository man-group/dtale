import * as React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';
import { WithTranslation, withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { DataSet } from 'vis-data/standalone/umd/vis-data.min';
import { Edge, Network, Node, Options } from 'vis-network/standalone/umd/vis-network.min';

import { BouncerWrapper } from '../BouncerWrapper';
import ColumnSelect from '../popups/create/ColumnSelect';
import { AppState } from '../redux/state/AppState';
import { RemovableError } from '../RemovableError';
import * as DtypesRepository from '../repository/DtypesRepository';
import * as NetworkRepository from '../repository/NetworkRespository';

import ArrowToggle from './ArrowToggle';
import GroupsLegend from './GroupsLegend';
import HierarchyToggle from './HierarchyToggle';
import NetworkAnalysis from './NetworkAnalysis';
import NetworkDescription from './NetworkDescription';
import {
  GroupColor,
  NetworkClickParameters,
  NetworkDisplayComponentProps,
  NetworkDisplayReduxProps,
  NetworkDisplayState,
  ValueHolder,
} from './NetworkState';
import { NetworkUrlParams } from './NetworkUrlParams';
import * as networkUtils from './networkUtils';
import ShortestPath from './ShortestPath';

require('./NetworkDisplay.css');
require('vis-network/styles/vis-network.min.css');

/** All properties for NetworkDisplay */
type AllProps = NetworkDisplayComponentProps & WithTranslation & NetworkDisplayReduxProps;

/** Component for displaying network data in a directed or undirected graph. */
class ReactNetworkDisplay extends React.Component<AllProps, NetworkDisplayState> {
  private container = React.createRef<HTMLDivElement>();
  private network: Network | undefined = undefined;
  private doubleClickTime = 0;

  /** @override */
  public constructor(props: AllProps) {
    super(props);

    this.state = networkUtils.buildState(props);
    this.onClick = this.onClick.bind(this);
    this.neighborhoodHighlight = this.neighborhoodHighlight.bind(this);
    this.load = this.load.bind(this);
    this.draw = this.draw.bind(this);
    this.highlightPath = this.highlightPath.bind(this);
  }

  /** @override */
  public async componentDidMount(): Promise<void> {
    const response = await DtypesRepository.loadDtypes(this.props.dataId);
    if (response?.error) {
      this.setState({
        error: <RemovableError {...response} onRemove={() => this.setState({ error: undefined })} />,
      });
      return;
    }
    this.setState({ error: undefined, loadingDtypes: false, dtypes: response?.dtypes ?? [] }, () => {
      if (this.state.to && this.state.from) {
        this.load();
      }
    });
  }

  /** @override */
  public render(): React.ReactNode {
    const { t } = this.props;
    const { allNodes, dtypes, error, to, from, weight, loadingDtypes, loadingData, params } = this.state;
    const loadDisabled = !(to && from);
    return (
      <React.Fragment>
        <NetworkUrlParams params={params ?? {}} propagateState={(state) => this.setState(state, this.load)} />
        <NetworkDescription />
        {error}
        <BouncerWrapper showBouncer={loadingDtypes}>
          <div className="row">
            <div className="col-md-5 p-0">
              <ColumnSelect
                label={t('To')}
                prop="to"
                parent={this.state}
                updateState={(state: { to?: ValueHolder<string> }) => this.setState(state)}
                columns={dtypes ?? []}
                otherProps={['from']}
              />
              <ColumnSelect
                label={t('From')}
                prop="from"
                parent={this.state}
                updateState={(state: { from?: ValueHolder<string> }) => this.setState(state)}
                columns={dtypes ?? []}
                otherProps={['to']}
              />
            </div>
            <div className="col-md-5 p-0">
              <div className="row h-100">
                <div className="col-md-6 p-0 mb-4">
                  <ColumnSelect
                    label={t('Group')}
                    prop="group"
                    parent={this.state}
                    updateState={(state: { group?: ValueHolder<string> }) => this.setState(state)}
                    columns={dtypes ?? []}
                    otherProps={['to', 'from']}
                  />
                </div>
                <div className="col-md-6 p-0 mb-4">
                  <ColumnSelect
                    label={t('Weight')}
                    prop="weight"
                    parent={this.state}
                    updateState={(state: { weight?: ValueHolder<string> }) => this.setState(state)}
                    columns={dtypes ?? []}
                    otherProps={['to', 'from']}
                  />
                </div>
                <div className="col-md-6 p-0">
                  <ColumnSelect
                    label={t('Color')}
                    prop="color"
                    parent={this.state}
                    updateState={(state: { color?: ValueHolder<string> }) => this.setState(state)}
                    columns={dtypes ?? []}
                    otherProps={['to', 'from']}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-2 text-right">
              <button
                className="btn btn-primary load-network"
                onClick={loadingData ? () => undefined : this.load}
                disabled={loadDisabled}
              >
                <BouncerWrapper showBouncer={this.state.loadingData}>
                  <span>{t('Load')}</span>
                </BouncerWrapper>
              </button>
            </div>
          </div>
          {!!this.network && (
            <React.Fragment>
              <NetworkAnalysis to={to} from={from} weight={weight} />
              <div className="row pt-3">
                <HierarchyToggle updateHierarchy={(hierarchy) => this.setState({ hierarchy }, this.draw)} />
                <ArrowToggle
                  {...this.state.arrows}
                  updateArrows={(arrows) => this.setState({ arrows: { ...this.state.arrows, ...arrows } }, this.draw)}
                />
              </div>
              <ShortestPath
                nodes={this.state.shortestPath}
                to={to}
                from={from}
                allNodes={allNodes}
                highlightPath={this.highlightPath}
                clearPath={() => this.neighborhoodHighlight({ nodes: [] })}
              />
              <GlobalHotKeys
                keyMap={{ ZOOM_OUT: 'esc' }}
                handlers={{ ZOOM_OUT: () => this.network?.fit(networkUtils.ZOOM) }}
              />
              <GroupsLegend groups={this.state.groups} />
            </React.Fragment>
          )}
          <div style={{ height: 'calc(100% - 205px)' }} ref={this.container} />
        </BouncerWrapper>
      </React.Fragment>
    );
  }

  /**
   * Highlight node path on vis-network graph.
   *
   * @param path names of the nodes in the path to highlight.
   */
  private highlightPath(path: string[]): void {
    const { allNodes } = this.state;
    Object.entries(allNodes ?? {}).forEach(([nodeId, node]) =>
      networkUtils.resetNode(
        node,
        path.includes(allNodes?.[nodeId]?.label ?? '') ? undefined : 'rgba(150,150,150,0.75)',
      ),
    );
    const nodesDataset = (this.network as any)?.body.data.nodes;
    nodesDataset.update(Object.values(allNodes ?? {}));
    this.setState({ highlightActive: true, shortestPath: [] });
  }

  /**
   * Click callback function to be executed in setTimeout to make sure we're not colliding with a double click event.
   *
   * @param networkParams event parameters from vis-network.
   * @param t0 the current time in milliseconds.
   * @return a callback function to be executed in setTimeout.
   */
  private onClickCallback(networkParams: NetworkClickParameters, t0: number): () => void {
    return () => {
      const { shortestPath, allNodes } = this.state;
      if (t0 - this.doubleClickTime > networkUtils.DBL_CLICK_THRESHOLD) {
        if (networkParams.event?.srcEvent?.shiftKey && networkParams.nodes.length) {
          let updatedShortedPath = [...this.state.shortestPath];
          if (!shortestPath.includes(networkParams.nodes[0])) {
            updatedShortedPath = [...updatedShortedPath, networkParams.nodes[0]].slice(0, 2);
            Object.entries(allNodes ?? {}).forEach(([nodeId, node]) =>
              networkUtils.resetNode(
                node,
                updatedShortedPath.includes(parseInt(nodeId, 10)) ? undefined : 'rgba(150,150,150,0.75)',
              ),
            );
            const nodesDataset = (this.network as any)?.body.data.nodes;
            nodesDataset.update(Object.values(allNodes ?? {}));
            this.setState({ shortestPath: updatedShortedPath, highlightActive: true });
          }
          return;
        }
        this.neighborhoodHighlight(networkParams);
      }
    };
  }

  /**
   * Click handler for vis-network graph for selecting a node and highlighting it's direct descendents.
   *
   * @param networkParams event parameters from vis-network.
   */
  private onClick(networkParams: NetworkClickParameters): void {
    const t0 = new Date().getTime();
    if (t0 - this.doubleClickTime > networkUtils.DBL_CLICK_THRESHOLD) {
      const callback = this.onClickCallback(networkParams, t0);
      setTimeout(callback, networkUtils.DBL_CLICK_THRESHOLD);
    }
  }

  /**
   * Highlight direct descendents of clicked node in vis-network.
   *
   * @param networkParams event parameters from vis-network.
   */
  private neighborhoodHighlight(networkParams: NetworkClickParameters): void {
    const { allNodes, highlightActive } = this.state;
    const updatedHighlightActive = networkUtils.neighborhoodHighlight(
      { allNodes, highlightActive },
      this.network!,
      networkParams,
    );
    this.setState({ highlightActive: updatedHighlightActive, shortestPath: [] });
  }

  /**
   * Load network data to be displayed in vis-network graph.
   *
   * @return a promise which executes a load of network data.
   */
  private async load(): Promise<void> {
    const currParams = networkUtils.buildParams(this.state);
    if (!currParams.to || !currParams.from) {
      this.network?.destroy?.();
      this.network = undefined;
      this.setState({ ...networkUtils.buildState(), loadingDtypes: false, dtypes: this.state.dtypes });
      return;
    }
    this.setState({ loadingData: true });
    const response = await NetworkRepository.getData(this.props.dataId, currParams);
    if (response?.error) {
      this.setState({ error: <RemovableError {...response} />, loadingData: false });
      return;
    }
    const { nodes, edges } = response!;
    if (this.state.weight) {
      edges.forEach((edge) => (edge.title = `Weight: ${edge.value}`));
    }
    nodes.forEach((node) => (node.title = node.label));
    const nodesDataset = new DataSet(nodes);
    const edgesDataset = new DataSet(edges);
    this.draw(nodesDataset, edgesDataset);
    const networkNodes = (this.network as any)?.body.nodes;
    let groupsMapping: GroupColor[] = [];
    if (response?.groups && Object.keys(response.groups).length > 1) {
      groupsMapping = Object.entries(response.groups).map(([nodeGroup, nodeId]) => [
        nodeGroup,
        { ...networkNodes[nodeId]?.options?.color },
      ]);
    }
    this.setState({
      params: currParams,
      loadingData: false,
      allNodes: nodesDataset.get({ returnType: 'Object' }),
      highlightActive: false,
      groups: groupsMapping,
      error: undefined,
    });
  }

  /**
   * Draw the vis-network graph.
   *
   * @param nodeDataset graph nodes.
   * @param edgesDataset graph edges.
   */
  private draw(nodeDataset?: DataSet<Node>, edgesDataset?: DataSet<Edge>): void {
    const { arrows, hierarchy } = this.state;
    const dataset = {
      nodes: nodeDataset ?? (this.network as any)?.body.data.nodes,
      edges: edgesDataset ?? (this.network as any)?.body.data.edges,
    };
    const options: Options = { ...networkUtils.OPTIONS };
    options.layout = { ...networkUtils.BASE_LAYOUT };
    if (hierarchy) {
      options.layout.hierarchical = { direction: hierarchy };
    } else {
      options.layout.improvedLayout = true;
    }
    options.edges = {
      ...options.edges,
      arrows: {
        to: { enabled: arrows?.to, type: 'vee' },
        from: { enabled: arrows?.from, type: 'vee' },
      },
    };
    this.network = new Network(this.container.current!, dataset, options);
    this.network.on('click', this.onClick);
    this.network.on('doubleClick', (networkParams) => {
      this.doubleClickTime = new Date().getTime();
      if (networkParams.nodes.length) {
        this.network!.focus(networkParams.nodes[0], { ...networkUtils.ZOOM, scale: 1.5 });
      }
    });
  }
}

const TranslateReactNetworkDisplay = withTranslation('network')(ReactNetworkDisplay);
const ReduxNetworkDisplay = connect<
  NetworkDisplayReduxProps,
  Record<string, unknown>,
  NetworkDisplayComponentProps,
  AppState
>((state: AppState): NetworkDisplayReduxProps => ({ dataId: state.dataId }))(TranslateReactNetworkDisplay);

export { ReduxNetworkDisplay as NetworkDisplay, TranslateReactNetworkDisplay as ReactNetworkDisplay };
