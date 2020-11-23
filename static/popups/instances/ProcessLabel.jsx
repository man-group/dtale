import PropTypes from "prop-types";
import React from "react";

class ProcessLabel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { name, start } = this.props.process;
    return (
      <span className="d-inline text-nowrap">
        {`${this.props.process.data_id}${name ? ` - ${name}` : ""} (${start})`}
      </span>
    );
  }
}
ProcessLabel.displayName = "ProcessLabel";
ProcessLabel.propTypes = {
  process: PropTypes.object.isRequired,
};

export default ProcessLabel;
