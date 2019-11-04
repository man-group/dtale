import $ from "jquery";
import _ from "lodash";
import React from "react";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import Column from "react-virtualized/dist/commonjs/Table/Column";
import Table from "react-virtualized/dist/commonjs/Table/Table";

import { Bouncer } from "../Bouncer";
import { RemovableError } from "../RemovableError";
import * as gu from "../dtale/gridUtils";
import { fetchJson } from "../fetcher";

const INSTANCES_URL = "/dtale/processes";

require("./Instances.css");

function renderProcessLabel({ start, name }) {
  return [
    <span key={0} className="d-inline">
      {start}
    </span>,
    name ? <span key={1} className="d-inline pl-3">{`(${name})`}</span> : null,
  ];
}

class Instances extends React.Component {
  constructor(props) {
    super(props);
    this.state = { processes: {}, loadingProcesses: false, preview: null, loadingPreview: false };
    this.viewPreview = this.viewPreview.bind(this);
    this.renderPreview = this.renderPreview.bind(this);
  }

  componentDidMount() {
    this.setState({ loadingProcesses: true });
    fetchJson(INSTANCES_URL, processes =>
      this.setState({ processes, loadingProcesses: false }, () =>
        $("input#processes").val(_.get(processes, "data.length", 1))
      )
    );
  }

  viewPreview(instance) {
    this.setState({ loadingPreview: true });
    fetchJson(`/dtale/data?ids=${JSON.stringify(["0-5"])}&port=${instance.port}`, preview =>
      this.setState({ preview: _.assignIn({ instance }, preview), loadingPreview: false })
    );
  }

  renderPreview() {
    if (this.state.loadingPreview) {
      return <Bouncer />;
    }
    if (_.isNull(this.state.preview)) {
      return null;
    }
    if (this.state.preview.error) {
      return <RemovableError {...this.state.preview} />;
    }
    let ellipsesCol = null;
    if (this.state.preview.columns.length > 6) {
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
          {renderProcessLabel(this.state.preview.instance)}
          <span className="d-inline pl-3">Preview</span>
        </div>
      </h4>,
      <AutoSizer key={1} disableHeight>
        {({ width }) => (
          <Table
            height={400}
            headerHeight={gu.ROW_HEIGHT}
            overscanRowCount={10}
            rowStyle={{ display: "flex" }}
            rowHeight={gu.ROW_HEIGHT}
            rowGetter={({ index }) => this.state.preview.results[index]}
            rowCount={this.state.preview.total > 5 ? 6 : _.min([5, this.state.preview.total])}
            width={width}
            className="preview"
            headerClassName="headerCell">
            {_.map(_.range(1, _.min([6, this.state.preview.columns.length])), colIdx => (
              <Column
                key={colIdx}
                dataKey={this.state.preview.columns[colIdx].name}
                label={this.state.preview.columns[colIdx].name}
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

  render() {
    if (this.state.loadingProcesses) {
      return <Bouncer />;
    }
    if (this.state.processes.error) {
      return <RemovableError {...this.state.processes} />;
    }
    const processes = this.state.processes.data;
    const currentPort = window.location.port;

    const _rowClass = ({ index }) => {
      if (index < 0) {
        return "";
      }
      const currentPort = window.location.port;
      return currentPort === _.get(processes, [index, "port"]) ? "active" : "clickable";
    };
    const _rowClick = ({ rowData }) => {
      const currentHost = window.location.hostname;
      const currentPort = window.location.port;
      if (rowData.port == currentPort) {
        return;
      }
      window.location.assign(`http://${currentHost}:${rowData.port}`);
    };
    const viewPreview = rowData => e => {
      this.viewPreview(rowData);
      e.stopPropagation();
    };
    return (
      <div key="body" className="modal-body">
        <div className="row">
          <div className="col-md-7">
            <AutoSizer disableHeight>
              {({ width }) => (
                <Table
                  height={400}
                  headerHeight={gu.ROW_HEIGHT}
                  overscanRowCount={10}
                  rowStyle={{ display: "flex" }}
                  rowHeight={gu.ROW_HEIGHT}
                  rowGetter={({ index }) => processes[index]}
                  rowCount={_.size(processes)}
                  rowClassName={_rowClass}
                  width={width}
                  onRowClick={_rowClick}
                  className="instances"
                  headerClassName="headerCell">
                  <Column
                    dataKey="start"
                    label="Process"
                    width={200}
                    flexGrow={1}
                    style={{ textAlign: "left", paddingLeft: ".5em" }}
                    cellRenderer={({ rowData }) => <div>{renderProcessLabel(rowData)}</div>}
                    className="cell"
                  />
                  <Column
                    width={50}
                    dataKey="rows"
                    label="Rows"
                    style={{ textAlign: "right", paddingRight: ".5em", fontSize: "80%" }}
                    className="cell"
                  />
                  <Column
                    width={50}
                    dataKey="columns"
                    label="Cols"
                    style={{ textAlign: "right", paddingRight: ".5em", fontSize: "80%" }}
                    className="cell"
                  />
                  <Column
                    width={150}
                    flexGrow={1}
                    dataKey="names"
                    label="Column Names"
                    style={{ textAlign: "center", paddingRight: ".5em", fontSize: "80%" }}
                    cellRenderer={({ rowData }) => (
                      <span title={rowData.names.length > 30 ? _.join(_.split(rowData.names, ","), "\n") : null}>
                        {_.truncate(rowData.names)}
                      </span>
                    )}
                    className="cell"
                  />
                  <Column
                    width={75}
                    dataKey="port"
                    label=""
                    style={{ textAlign: "center", paddingRight: ".5em", fontSize: "80%" }}
                    cellRenderer={({ rowData }) => {
                      if (rowData.port === currentPort) {
                        return null;
                      }
                      return (
                        <button className="preview-btn" onClick={viewPreview(rowData)}>
                          Preview
                        </button>
                      );
                    }}
                    className="cell"
                  />
                </Table>
              )}
            </AutoSizer>
          </div>
          <div className="col-md-5">{this.renderPreview()}</div>
        </div>
      </div>
    );
  }
}
Instances.displayName = "Instances";

export default Instances;
