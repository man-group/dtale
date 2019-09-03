import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

class RemovableError extends React.Component {
  constructor(props) {
    super(props);
    this.traceback = this.traceback.bind(this);
    this.remove = this.remove.bind(this);
  }

  traceback() {
    if (this.props.traceback) {
      return (
        <div className="traceback">
          <pre>{this.props.traceback}</pre>
        </div>
      );
    }
    return null;
  }

  remove() {
    if (this.props.onRemove) {
      return <i className="ico-cancel float-right" onClick={this.props.onRemove} />;
    }

    return null;
  }

  render() {
    if (_.isEmpty(this.props.error)) {
      return null;
    }
    return (
      <div className="dtale-alert alert alert-danger" role="alert">
        <i className="ico-error" />
        <span>{this.props.error}</span>
        {this.remove()}
        {this.traceback()}
        {this.props.children}
      </div>
    );
  }
}
RemovableError.displayName = "RemovableError";
RemovableError.propTypes = {
  error: PropTypes.string,
  traceback: PropTypes.string,
  onRemove: PropTypes.func,
  children: PropTypes.node,
};

export { RemovableError };
