import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
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
import NetworkUrlParams from "./NetworkUrlParams";

require("./NetworkDisplay.css");
require("vis-network/styles/vis-network.min.css");

function buildParams({ to, from, weight, group }) {
  return {
    to: to?.value,
    from: from?.value,
    group: group?.value,
    weight: weight?.value,
  };
}

function buildState(props = {}) {
  return {
    error: null,
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
}

class ReactNetworkDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ...buildState(props), loadingDtypes: true };
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
    const highlightActive = Constants.neighborhoodHighlight(this.state, this.network, params);
    this.setState({ highlightActive, shortestPath: [] });
  }

  load() {
    const params = buildParams(this.state);
    if (!params.to || !params.from) {
      this.network?.destroy();
      this.network = null;
      this.setState({ ...buildState(), dtypes: this.state.dtypes });
      return;
    }
    this.setState({ loadingData: true });
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
      _.forEach(nodes, node => (node.title = node.label));
      const nodesDataset = new vis.DataSet(nodes);
      const edgesDataset = new vis.DataSet(edges);
      this.draw({ nodes: nodesDataset, edges: edgesDataset });
      const networkNodes = this.network.body.nodes;
      let groupsMapping = null;
      if (_.size(groups) > 1) {
        groupsMapping = _.map(groups, (nodeId, group) => [group, { ...networkNodes[nodeId]?.options?.color }]);
      }
      const allNodes = nodesDataset.get({ returnType: "Object" });
      this.setState({
        params,
        loadingData: false,
        allNodes,
        highlightActive: false,
        groups: groupsMapping,
        error: null,
      });
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
    const { t } = this.props;
    const { dtypes, error, to, from, loadingDtypes, loadingData } = this.state;
    const loadDisabled = !(to && from);
    return (
      <React.Fragment>
        <NetworkUrlParams params={this.state.params} propagateState={state => this.setState(state, this.load)} />
        <NetworkDescription />
        {error}
        <BouncerWrapper showBouncer={loadingDtypes}>
          <div className="row">
            <div className="col-md-5 p-0">
              <ColumnSelect
                label={t("To")}
                prop="to"
                parent={this.state}
                updateState={state => this.setState(state)}
                columns={dtypes}
                otherProps={["from"]}
              />
              <ColumnSelect
                label={t("From")}
                prop="from"
                parent={this.state}
                updateState={state => this.setState(state)}
                columns={dtypes}
                otherProps={["to"]}
              />
            </div>
            <div className="col-md-5 p-0">
              <ColumnSelect
                label={t("Group")}
                prop="group"
                parent={this.state}
                updateState={state => this.setState(state)}
                columns={dtypes}
                otherProps={["to", "from"]}
              />
              <ColumnSelect
                label={t("Weight")}
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
                  <span>{t("Load")}</span>
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
  t: PropTypes.func,
};
const TranslateReactNetworkDisplay = withTranslation("network")(ReactNetworkDisplay);
const ReduxNetworkDisplay = connect(({ dataId }) => ({ dataId }))(TranslateReactNetworkDisplay);

export { ReduxNetworkDisplay as NetworkDisplay, TranslateReactNetworkDisplay as ReactNetworkDisplay };
