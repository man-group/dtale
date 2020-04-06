import PropTypes from "prop-types";
import React from "react";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import Column from "react-virtualized/dist/commonjs/Table/Column";
import Table from "react-virtualized/dist/commonjs/Table/Table";

import { exports as gu } from "../dtale/gridUtils";

require("./ContextVariables.css");

const displayName = "Context Variables";
const propTypes = {
  contextVars: PropTypes.array.isRequired,
};

class ContextVariables extends React.Component {
  constructor(props) {
    super(props);
    this.renderInfoForUser = this.renderInfoForUser.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  renderInfoForUser() {
    return (
      <div>
        <h3>Context Variables</h3>
        <p>
          These are initialized via the <var>context_vars</var> argument to dtale.show(), ex:
          <span className="font-weight-bold"> dtale.show(df, context_vars={"{'foo': [1, 2, 3]}"})</span>
          <br />
          They can be referenced in filters by prefixing the variable name with {"'@'"}, ex:
          <span className="font-weight-bold"> Col in @foo </span>to only show rows where {"'Col'"} is in list {"'foo'"}
        </p>
      </div>
    );
  }

  renderTable() {
    if (this.props.contextVars.length === 0) {
      return <p>No context variables are defined.</p>;
    }
    return (
      <div>
        <AutoSizer disableHeight>
          {({ width }) => (
            <Table
              className="contextVariables"
              width={width}
              height={Math.min(300, (this.props.contextVars.length + 1) * (gu.ROW_HEIGHT + 2))}
              headerHeight={gu.ROW_HEIGHT}
              headerClassName="headerCell"
              rowHeight={gu.ROW_HEIGHT}
              rowCount={this.props.contextVars.length}
              rowGetter={({ index }) => this.props.contextVars[index]}
              rowStyle={{ display: "flex" }}>
              <Column label="Name" dataKey="name" width={200} className="cell" />
              <Column label="Value" dataKey="value" width={300} flexGrow={1} className="cell" />
            </Table>
          )}
        </AutoSizer>
      </div>
    );
  }

  render() {
    return (
      <div className="container mt-5 w-100">
        {this.renderInfoForUser()}
        {this.renderTable()}
      </div>
    );
  }
}

ContextVariables.displayName = displayName;
ContextVariables.propTypes = propTypes;

export default ContextVariables;
