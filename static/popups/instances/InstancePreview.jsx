import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import Column from "react-virtualized/dist/commonjs/Table/Column";
import Table from "react-virtualized/dist/commonjs/Table/Table";

import { RemovableError } from "../../RemovableError";
import { exports as gu } from "../../dtale/gridUtils";
import ProcessLabel from "./ProcessLabel";

class InstancePreview extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { preview } = this.props;
    if (_.isNull(preview)) {
      return null;
    }
    if (preview.error) {
      return <RemovableError {...preview} />;
    }
    let ellipsesCol = null;
    if (preview.columns.length > 6) {
      ellipsesCol = (
        <Column
          label="..."
          dataKey="dtale_index"
          cellRenderer={() => "..."}
          width={30}
          maxWidth={30}
          minWidth={30}
          style={{ textAlign: "center" }}
          className="cell"
        />
      );
    }
    return [
      <h4 key={0} className="preview-header">
        <div>
          <ProcessLabel process={preview.instance} />
          <span className="d-inline pl-3">Preview</span>
        </div>
      </h4>,
      <AutoSizer key={1} disableHeight>
        {({ width }) => (
          <Table
            height={200}
            autoHeight={true}
            headerHeight={gu.ROW_HEIGHT}
            overscanRowCount={10}
            rowStyle={{ display: "flex" }}
            rowHeight={gu.ROW_HEIGHT}
            rowGetter={({ index }) => preview.results[index]}
            rowCount={preview.total > 5 ? 6 : _.min([5, preview.total])}
            width={width}
            className="preview"
            headerClassName="headerCell">
            {_.map(_.range(1, _.min([6, preview.columns.length])), colIdx => (
              <Column
                key={colIdx}
                dataKey={preview.columns[colIdx].name}
                label={preview.columns[colIdx].name}
                width={50}
                maxWidth={50}
                minWidth={50}
                style={{ textAlign: "right", paddingRight: ".5em" }}
                className="cell"
                cellRenderer={({ rowData, rowIndex, dataKey }) => {
                  if (rowIndex == 5) {
                    return "...";
                  }
                  return _.get(rowData, dataKey, "N/A");
                }}
              />
            ))}
            {ellipsesCol}
          </Table>
        )}
      </AutoSizer>,
    ];
  }
}
InstancePreview.displayName = "InstancePreview";
InstancePreview.propTypes = {
  preview: PropTypes.object,
};

export default InstancePreview;
