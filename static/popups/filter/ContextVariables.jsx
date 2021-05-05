import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import Column from "react-virtualized/dist/commonjs/Table/Column";
import Table from "react-virtualized/dist/commonjs/Table/Table";

import * as gu from "../../dtale/gridUtils";

require("./ContextVariables.css");

class ContextVariables extends React.Component {
  constructor(props) {
    super(props);
    this.renderInfoForUser = this.renderInfoForUser.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  renderInfoForUser() {
    const { t } = this.props;
    return (
      <div>
        <h3>{t("Context Variables")}</h3>
        <p>
          {t("context_variables_des1")}
          <var>context_vars</var>
          {t("context_variables_des2")}
          {"dtale.show(), ex:"}
          <span className="font-weight-bold"> dtale.show(df, context_vars={"{'foo': [1, 2, 3]}"})</span>
          <br />
          {t("context_variables_des3")}
          {"ex:"}
          <span className="font-weight-bold"> Col in @foo </span>
          {t("context_variables_des4")}
        </p>
      </div>
    );
  }

  renderTable() {
    const { contextVars, t } = this.props;
    if (contextVars.length === 0) {
      return <p>{t("No context variables are defined.")}</p>;
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

ContextVariables.displayName = "Context Variables";
ContextVariables.propTypes = {
  contextVars: PropTypes.array.isRequired,
  t: PropTypes.func,
};

export default withTranslation("filter")(ContextVariables);
