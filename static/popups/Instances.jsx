import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import Column from "react-virtualized/dist/commonjs/Table/Column";
import Table from "react-virtualized/dist/commonjs/Table/Table";

import { Bouncer } from "../Bouncer";
import { RemovableError } from "../RemovableError";
import { exports as gu } from "../dtale/gridUtils";
import { fetchJson } from "../fetcher";

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
    this.state = {
      processes: {},
      loadingProcesses: false,
      preview: null,
      loadingPreview: false,
    };
    this.viewPreview = this.viewPreview.bind(this);
    this.renderPreview = this.renderPreview.bind(this);
  }

  componentDidMount() {
    this.setState({ loadingProcesses: true });
    fetchJson("/dtale/processes", processes =>
      this.setState({ processes, loadingProcesses: false }, () =>
        $("input#processes").val(_.get(processes, "data.length", 1))
      )
    );
  }

  cleanup(instance) {
    fetchJson(`/dtale/cleanup/${instance.data_id}`, data => {
      if (data.success) {
        const currProcesses = _.get(this.state, "processes.data") || [];
        const processes = _.map(_.reject(currProcesses, { data_id: instance.data_id }), p => _.assignIn({}, p));
        this.setState({ processes: { data: processes } });
      }
    });
  }

  viewPreview(instance) {
    this.setState({ loadingPreview: true });
    fetchJson(`/dtale/data/${instance.data_id}?ids=${JSON.stringify(["0-5"])}`, preview =>
      this.setState({
        preview: _.assignIn({ instance }, preview),
        loadingPreview: false,
      })
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
    const _rowClass = ({ index }) => {
      if (index < 0) {
        return "";
      }
      return this.props.dataId === _.get(processes, [index, "data_id"]) ? "active" : "clickable";
    };
    const _rowClick = ({ rowData }) => {
      if (rowData.data_id === this.props.dataId) {
        return;
      }
      const currentHost = window.location.origin;
      const newLoc = `${currentHost}${this.props.iframe ? "/dtale/iframe/" : "/dtale/main/"}${rowData.data_id}`;
      if (_.startsWith(window.location.pathname, "/dtale/popup/instances")) {
        window.opener.location.assign(newLoc);
        window.close();
        return;
      }
      window.location.assign(newLoc);
    };
    let previewCol = null,
      cleanupCol = null;
    if (_.size(processes) > 1) {
      const viewPreview = rowData => e => {
        this.viewPreview(rowData);
        e.stopPropagation();
      };
      previewCol = (
        <Column
          width={75}
          dataKey="data_id"
          label=""
          style={{
            textAlign: "center",
            paddingRight: ".5em",
            fontSize: "80%",
          }}
          cellRenderer={({ rowData }) => {
            if (rowData.data_id === this.props.dataId) {
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
      );
      const cleanup = rowData => e => {
        this.cleanup(rowData);
        e.stopPropagation();
      };
      cleanupCol = (
        <Column
          width={50}
          dataKey="data_id"
          label=""
          style={{ textAlign: "center" }}
          cellRenderer={({ rowData }) => {
            if (rowData.data_id === this.props.dataId) {
              return null;
            }
            return <i className="ico-delete" onClick={cleanup(rowData)} />;
          }}
          className="cell"
        />
      );
    }
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
                  {cleanupCol}
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
                    style={{
                      textAlign: "right",
                      paddingRight: ".5em",
                      fontSize: "80%",
                    }}
                    className="cell"
                  />
                  <Column
                    width={50}
                    dataKey="columns"
                    label="Cols"
                    style={{
                      textAlign: "right",
                      paddingRight: ".5em",
                      fontSize: "80%",
                    }}
                    className="cell"
                  />
                  <Column
                    width={150}
                    flexGrow={1}
                    dataKey="names"
                    label="Column Names"
                    style={{
                      textAlign: "center",
                      paddingRight: ".5em",
                      fontSize: "80%",
                    }}
                    cellRenderer={({ rowData }) => (
                      <span title={rowData.names.length > 30 ? _.join(_.split(rowData.names, ","), "\n") : null}>
                        {_.truncate(rowData.names)}
                      </span>
                    )}
                    className="cell"
                  />
                  {previewCol}
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
Instances.propTypes = {
  iframe: PropTypes.bool,
  dataId: PropTypes.string.isRequired,
};

export default Instances;
