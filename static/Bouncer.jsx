import React from "react";

// Based on http://tobiasahlin.com/spinkit/
require("./Bouncer.css");

class Bouncer extends React.Component {
  render() {
    return (
      <div className="bouncer">
        <div className="double-bounce1" />
        <div className="double-bounce2" />
      </div>
    );
  }
}
Bouncer.displayName = "Bouncer";

export { Bouncer };
