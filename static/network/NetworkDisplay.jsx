import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import vis from "vis-network/dist/vis-network";

import { BouncerWrapper } from "../BouncerWrapper";
import { RemovableError } from "../RemovableError";
import { buildURLString, dtypesUrl } from "../actions/url-utils";
import { fetchJson } from "../fetcher";
import ColumnSelect from "../popups/create/ColumnSelect";
import NetworkDescription from "./NetworkDescription";
import { GlobalHotKeys } from "react-hotkeys";
import GroupsLegend from "./GroupsLegend";
import { ShortestPath } from "./ShortestPath";
import HierarchyToggle from "./HierarchyToggle";
import * as Constants from "./networkUtils";
import { NetworkAnalysis } from "./NetworkAnalysis";

require("./NetworkDisplay.css");
require("vis-network/styles/vis-network.min.css");

class ReactNetworkDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      loadingDtypes: true,
      loadingData: false,
      dtypes: null,
      to: props.to ? { value: props.to } : null,
      from: props.from ? { value: props.from } : null,
      group: props.group ? { value: props.group } : null,
      weight: props.weight ? { value: props.weight } : null,
      hierarchy: null,
      groups: null,
      shortestPath: [],
    };
    this.onClick = this.onClick.bind(this);
    this.neighborhoodHighlight = this.neighborhoodHighlight.bind(this);
    this.load = this.load.bind(this);
    this.draw = this.draw.bind(this);
    this.highlightPath = this.highlightPath.bind(this);
    this.container = React.createRef();
    this.doubleClickTime = 0;
  }

  componentDidMount() {
    fetchJson(dtypesUrl(this.props.dataId), dtypesData => {
      const newState = {
        error: null,
        loadingDtypes: false,
      };
      if (dtypesData.error) {
        this.setState({
          error: <RemovableError {...dtypesData} onRemove={() => this.setState({ error: null })} />,
        });
        return;
      }
      newState.dtypes = dtypesData.dtypes;
      this.setState(newState, () => {
        if (this.state.to && this.state.from) {
          this.load();
        }
      });
    });
  }

  highlightPath(path) {
    const { allNodes } = this.state;
    _.forEach(allNodes, (node, nodeId) =>
      Constants.resetNode(node, _.includes(path, allNodes[nodeId].label) ? undefined : "rgba(150,150,150,0.75)")
    );
    const network = this.network;
    const nodesDataset = network.body.data.nodes;
    nodesDataset.update(_.values(allNodes));
    this.setState({ highlightActive: true, shortestPath: [] });
  }

  onClick(params) {
    const t0 = new Date();
    if (t0 - this.doubleClickTime > Constants.DBL_CLICK_THRESHOLD) {
      setTimeout(
        function () {
          if (t0 - this.doubleClickTime > Constants.DBL_CLICK_THRESHOLD) {
            if (params?.event?.srcEvent?.shiftKey && params.nodes.length) {
              let { shortestPath } = this.state;
              if (!_.includes(shortestPath, params.nodes[0])) {
                shortestPath = _.slice(_.concat(shortestPath, params.nodes[0]), 0, 2);
                const { allNodes } = this.state;
                _.forEach(allNodes, (node, nodeId) =>
                  Constants.resetNode(
                    node,
                    _.includes(shortestPath, parseInt(nodeId)) ? undefined : "rgba(150,150,150,0.75)"
                  )
                );
                const network = this.network;
                const nodesDataset = network.body.data.nodes;
                nodesDataset.update(_.values(allNodes));
                this.setState({ shortestPath, highlightActive: true });
              }
              return;
            }
            this.neighborhoodHighlight(params);
          }
        }.bind(this),
        Constants.DBL_CLICK_THRESHOLD
      );
    }
  }

  neighborhoodHighlight(params) {
    let { allNodes, highlightActive } = this.state;
    const network = this.network;
    const nodesDataset = network.body.data.nodes;
    // if something is selected:
    if (params.nodes.length > 0) {
      highlightActive = true;
      const selectedNodeId = params.nodes[0];

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
      _.forEach(
        connectedNodes,
        node => (allConnectedNodes = allConnectedNodes.concat(network.getConnectedNodes(node)))
      );

      // all second degree nodes get a different color and their label back
      _.forEach(allConnectedNodes, connectedNode =>
        Constants.resetNode(allNodes[connectedNode], "rgba(150,150,150,0.75)")
      );

      // all first degree nodes get their own color and their label back
      _.forEach(connectedNodes, connectedNode => Constants.resetNode(allNodes[connectedNode]));

      // the main node gets its own color and its label back.
      Constants.resetNode(allNodes[selectedNodeId]);
    } else if (highlightActive === true) {
      // reset all nodes
      _.forEach(allNodes, node => Constants.resetNode(node));
      highlightActive = false;
    }

    nodesDataset.update(_.values(allNodes));
    this.setState({ highlightActive, shortestPath: [] });
  }

  load() {
    const { to, from, group, weight } = this.state;
    this.setState({ loadingData: true });
    const params = {
      to: to?.value,
      from: from?.value,
      group: group?.value ?? "",
      weight: weight?.value ?? "",
    };
    fetchJson(buildURLString(`/dtale/network-data/${this.props.dataId}?`, params), data => {
      if (data.error) {
        this.setState({
          error: <RemovableError {...data} />,
          loadingData: false,
        });
        return;
      }
      const { nodes, edges, groups } = data;
      if (this.state.weight) {
        _.forEach(edges, edge => (edge.title = `Weight: ${edge.value}`));
      }
      const nodesDataset = new vis.DataSet(nodes);
      const edgesDataset = new vis.DataSet(edges);
      this.draw({ nodes: nodesDataset, edges: edgesDataset });
      const networkNodes = this.network.body.nodes;
      let groupsMapping = null;
      if (_.size(groups) > 1) {
        groupsMapping = _.map(groups, (nodeId, group) => [group, { ...networkNodes[nodeId]?.options?.color }]);
      }
      const allNodes = nodesDataset.get({ returnType: "Object" });
      this.setState({ loadingData: false, allNodes, highlightActive: false, groups: groupsMapping, error: null });
    });
  }

  draw(data) {
    const dataset = data ?? this.network?.body.data;
    const options = { ...Constants.OPTIONS };
    options.layout = { ...Constants.BASE_LAYOUT };
    if (this.state.hierarchy) {
      options.layout.hierarchical = { direction: this.state.hierarchy };
    }
    this.network = new vis.Network(this.container.current, dataset, options);
    this.network.on("click", this.onClick);
    this.network.on("doubleClick", params => {
      this.doubleClickTime = new Date();
      if (params.nodes.length) {
        this.network.focus(params.nodes[0], { ...Constants.ZOOM, scale: 1.5 });
      }
    });
  }

  render() {
    const { dtypes, error, to, from, loadingDtypes, loadingData } = this.state;
    const loadDisabled = !(to && from);
    return (
      <React.Fragment>
        <NetworkDescription />
        {error}
        <BouncerWrapper showBouncer={loadingDtypes}>
          <div className="row">
            <div className="col-md-5 p-0">
              <ColumnSelect
                label="To"
                prop="to"
                parent={this.state}
                updateState={state => this.setState(state)}
                columns={dtypes}
                otherProps={["from"]}
              />
              <ColumnSelect
                label="From"
                prop="from"
                parent={this.state}
                updateState={state => this.setState(state)}
                columns={dtypes}
                otherProps={["to"]}
              />
            </div>
            <div className="col-md-5 p-0">
              <ColumnSelect
                label="Group"
                prop="group"
                parent={this.state}
                updateState={state => this.setState(state)}
                columns={dtypes}
                otherProps={["to", "from"]}
              />
              <ColumnSelect
                label="Weight"
                prop="weight"
                parent={this.state}
                updateState={state => this.setState(state)}
                columns={dtypes}
                otherProps={["to", "from"]}
              />
            </div>
            <div className="col-md-2 text-right">
              <button
                className="btn btn-primary load-network"
                onClick={loadingData ? _.noop : this.load}
                disabled={loadDisabled}>
                <BouncerWrapper showBouncer={this.state.loadingData}>
                  <span>Load</span>
                </BouncerWrapper>
              </button>
            </div>
          </div>
          {this.network && (
            <React.Fragment>
              <NetworkAnalysis {..._.pick(this.state, ["to", "from", "weight"])} />
              <HierarchyToggle updateHierarchy={hierarchy => this.setState({ hierarchy }, this.draw)} />
              <ShortestPath
                nodes={this.state.shortestPath}
                {..._.pick(this.state, ["to", "from", "allNodes"])}
                highlightPath={this.highlightPath}
              />
              <GlobalHotKeys
                keyMap={{ ZOOM_OUT: "esc" }}
                handlers={{ ZOOM_OUT: () => this.network.fit(Constants.ZOOM) }}
              />
              <GroupsLegend groups={this.state.groups} />
            </React.Fragment>
          )}
          <div style={{ height: "calc(100% - 170px)" }} ref={this.container} />
        </BouncerWrapper>
      </React.Fragment>
    );
  }
}
ReactNetworkDisplay.displayName = "ReactNetworkDisplay";
ReactNetworkDisplay.propTypes = {
  dataId: PropTypes.string.isRequired,
  to: PropTypes.string,
  from: PropTypes.string,
  group: PropTypes.string,
  weight: PropTypes.string,
};

const ReduxNetworkDisplay = connect(({ dataId }) => ({ dataId }))(ReactNetworkDisplay);

export { ReduxNetworkDisplay as NetworkDisplay, ReactNetworkDisplay };
