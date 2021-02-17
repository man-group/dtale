import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import { fetchJson } from "../fetcher";
import { buildURLString } from "../actions/url-utils";
import { RemovableError } from "../RemovableError";

class ReactShortestPath extends React.Component {
  constructor(props) {
    super(props);
    this.state = { shortestPath: null, error: null };
  }

  componentDidUpdate(prevProps) {
    const { nodes, to, from, allNodes, dataId } = this.props;
    if (prevProps.nodes !== nodes && nodes.length == 2) {
      const [start, end] = nodes;
      const params = {
        to: to?.value,
        from: from?.value,
        start: allNodes[start].label,
        end: allNodes[end].label,
      };
      fetchJson(buildURLString(`/dtale/shortest-path/${dataId}?`, params), data => {
        if (data.error) {
          this.setState({
            error: <RemovableError {...data} onRemove={() => this.setState({ error: null })} />,
          });
          return;
        }
        this.setState(
          { shortestPath: data.data, start: params.start, end: params.end, error: null },
          this.props.highlightPath(data.data)
        );
      });
    }
  }

  render() {
    if (this.state.shortestPath) {
      return (
        <div className="row m-3 mt-3 shortest-path">
          <div className="col">
            {`${this.props.t("Shortest path between nodes")} ${this.state.start} & ${this.state.end}: `}
            <b>{_.join(this.state.shortestPath, " -> ")}</b>
          </div>
          <div className="col-auto">
            <i className="ico-close pointer" onClick={() => this.setState({ shortestPath: null })} />
          </div>
        </div>
      );
    }
    return null;
  }
}
ReactShortestPath.displayName = "ReactShortestPath";
ReactShortestPath.propTypes = {
  to: PropTypes.object,
  from: PropTypes.object,
  nodes: PropTypes.array,
  allNodes: PropTypes.object,
  dataId: PropTypes.string,
  highlightPath: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactShortestPath = withTranslation("network")(ReactShortestPath);
const ReduxShortestPath = connect(({ dataId }) => ({ dataId }))(TranslateReactShortestPath);

export { ReduxShortestPath as ShortestPath, TranslateReactShortestPath as ReactShortestPath };
