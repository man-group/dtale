import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { RemovableError } from "../RemovableError";

class ReactError extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div key="body" className="modal-body">
        <div className="row">
          <div className="col-md-12">
            <RemovableError {...this.props.chartData} />
          </div>
        </div>
      </div>
    );
  }
}
ReactError.displayName = "Error";
ReactError.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    error: PropTypes.string,
    traceback: PropTypes.string,
  }),
  onClose: PropTypes.func,
};

const ReduxError = connect(state => _.pick(state, ["chartData"]))(ReactError);

export { ReactError, ReduxError as Error };
