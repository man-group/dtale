import PropTypes from "prop-types";
import React from "react";

import * as actions from "../actions/dtale";
import _ from "lodash";
import querystring from "querystring";

const DATA_PROPS = ["to", "from", "weight", "group"];

export default class NetworkUrlParams extends React.Component {
  constructor(props) {
    super(props);
    this.state = { oldOnPopState: null };
    this.callOnChangeFunctions = this.callOnChangeFunctions.bind(this);
  }

  callOnChangeFunctions() {
    const params = actions.getParams();
    const newState = {};
    _.forEach(DATA_PROPS, key => {
      const urlValue = params[key];
      newState[key] = urlValue ? { value: urlValue } : null;
    });
    this.props.propagateState(newState);
  }

  // Once we're loaded, hook into the history API to spot any changes
  componentDidMount() {
    if (window.onpopstate) {
      this.setState({ oldOnPopState: window.onpopstate });
    }

    window.onpopstate = event => {
      this.callOnChangeFunctions();

      // Call any other onpopstate handlers.
      if (this.state.oldOnPopState) {
        this.state.oldOnPopState.call(window, event);
      }
    };
  }
  // Cleanup window.onpopstate.
  componentWillUnmount() {
    window.onpopstate = this.state.oldOnPopState;
  }

  componentDidUpdate(prevProps) {
    if (_.isEqual(prevProps.params, this.props.params)) {
      return;
    }
    const urlParams = actions.getParams();
    const shouldUpdateUrl = _.find(DATA_PROPS, key => this.props.params?.[key] != urlParams[key]);

    if (shouldUpdateUrl) {
      history.pushState({}, "", `?${querystring.stringify(this.props.params)}`);
    }
  }

  render() {
    return null;
  }
}
NetworkUrlParams.propTypes = {
  params: PropTypes.object,
  propagateState: PropTypes.func,
};
