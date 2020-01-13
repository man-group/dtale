import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";

import WordcloudBody from "../../../popups/charts/WordcloudBody.jsx";

/**
 * Wordcloud is a wrapper component for react-wordcloud usage by dash.
 * It takes a property, `data`, containing a series of words and a series of weights and displays a wordcloud
 * or group of wordclouds depending on whether a `group` value has been specified.
 */
export default class Wordcloud extends Component {
  render() {
    const { id } = this.props;
    const buildObj = value => ({ value });
    return (
      <div id={id}>
        <WordcloudBody
          {..._.pick(this.props, ["data", "height"])}
          y={_.map(this.props.y || [], buildObj)}
          group={_.map(this.props.group || [], buildObj)}
          chartType={{ value: "wordcloud" }}
        />
      </div>
    );
  }
}
Wordcloud.defaultProps = { height: 400 };
Wordcloud.propTypes = {
  /**
   * The ID used to identify this component in Dash callbacks.
   */
  id: PropTypes.string.isRequired,

  /**
   * Server-side data containing words "data[group].x" and weights "data[group][y-prop]".
   */
  data: PropTypes.object,

  /**
   * List of properties to use as weights.
   */
  y: PropTypes.arrayOf(PropTypes.string),

  /**
   * List of properties to use as groups.
   */
  group: PropTypes.arrayOf(PropTypes.string),

  /**
   * Height of wordcloud in pixels (default: 400).
   */
  height: PropTypes.number,
};
