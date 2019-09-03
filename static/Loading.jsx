import PropTypes from "prop-types";
import React from "react";

// Based on http://tobiasahlin.com/spinkit/
require("./Loading.css");

class Loading extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <div className="loading">{this.props.message}</div>;
  }
}
Loading.displayName = "Loading";
Loading.propTypes = {
  message: PropTypes.string,
};
Loading.defaultProps = {
  message: "Loading",
};

export { Loading };
