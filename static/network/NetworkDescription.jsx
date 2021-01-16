import React from "react";

import Collapsible from "../Collapsible";

export default class NetworkDescription extends React.Component {
  constructor(props) {
    super(props);
    this.renderDescription = this.renderDescription.bind(this);
  }

  renderDescription() {
    return (
      <div className="row pt-3 pb-3">
        <div className="col-auto">
          <h3>Example Data</h3>
          <table border="1" className="text-center">
            <thead>
              <tr>
                <th className="p-3">to</th>
                <th className="p-3">from</th>
                <th className="p-3">group</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>a</td>
                <td>b</td>
                <td>1</td>
              </tr>
              <tr>
                <td>b</td>
                <td>c</td>
                <td>2</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="col">
          <ul>
            <li>
              {`For this example, you would select the columns `}
              <b>to</b>
              {` and `}
              <b>from</b>
              {` for "To" & "From" and optionally the column `}
              <b>group</b>
              {` can be used for "Group" and/or "Weight" (the weight of an edge)`}
            </li>
            <li>
              {`The "Group" input will associate the group value to the value of "From". So in this example the node `}
              <b>a</b>
              {` would get the group value, N/A.`}
            </li>
            <li>{`Arrows will point in the direction of "To" -> "From"`}</li>
            <li>
              {`The "Weight" input will apply scaling to the edges of the network based on the weight and if you `}
              {` hover over the edge it will show you the exact weight`}
            </li>
            <li>
              <b>Clicking</b>
              {` on a node will highlight the node and its direct ancestors and clicking in the `}
              {`whitespace will highlight all nodes.`}
            </li>
            <li>
              <b>Double Clicking</b>
              {` on a node will zoom in on it and pressing `}
              <b>Esc</b>
              {` will reset the zoom`}
            </li>
            <li>
              <b>Shift+Clicking</b>
              {` two nodes will calculate and highlight the `}
              <b>Shortest Path</b>
              {` between those two nodes`}
            </li>
          </ul>
        </div>
      </div>
    );
  }

  render() {
    const title = (
      <React.Fragment>
        {`Network Viewer `}
        <small>(expand for directions)</small>
      </React.Fragment>
    );
    return (
      <div className="row pb-5">
        <div className="col-md-12">
          <Collapsible title={title} content={this.renderDescription()} />
        </div>
      </div>
    );
  }
}
