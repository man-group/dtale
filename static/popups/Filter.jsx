import _ from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { Bouncer } from "../Bouncer";
import { RemovableError } from "../RemovableError";
import { closeChart } from "../actions/charts";
import { buildURLString } from "../actions/url-utils";
import serverState from "../dtale/serverStateManagement";
import { fetchJson } from "../fetcher";
import ContextVariables from "./ContextVariables";

function saveFilter(dataId, query, callback) {
  fetchJson(buildURLString(`/dtale/test-filter/${dataId}`, { query, save: true }), callback);
}

class ReactFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { query: "", error: null };
    this.save = this.save.bind(this);
    this.renderColumnFilters = this.renderColumnFilters.bind(this);
    this.renderBody = this.renderBody.bind(this);
  }

  componentDidMount() {
    fetchJson(`/dtale/filter-info/${this.props.dataId}`, data => {
      this.setState(_.assignIn({ error: null, loading: false }, data));
    });
  }

  save() {
    const callback = data => {
      if (data.error) {
        this.setState({ error: data.error, traceback: data.traceback });
        return;
      }
      if (_.startsWith(window.location.pathname, "/dtale/popup/filter")) {
        window.opener.location.reload();
        window.close();
      } else {
        this.props.chartData.propagateState({ query: this.state.query }, this.props.onClose);
      }
    };
    saveFilter(this.props.dataId, this.state.query, callback);
  }

  renderColumnFilters(prop, label) {
    const { dataId } = this.props;
    const filters = this.state[prop];
    if (_.size(filters)) {
      const dropColFilter = col => () => {
        const updatedSettings = {
          [prop]: _.pickBy(filters, (_, k) => k !== col),
        };
        serverState.updateSettings(updatedSettings, dataId, () => {
          if (_.startsWith(window.location.pathname, "/dtale/popup/filter")) {
            window.opener.location.reload();
          } else {
            this.props.chartData.propagateState(updatedSettings, () => this.setState(updatedSettings));
          }
        });
      };
      return _.concat(
        [
          <div key="col-filter-label" className="font-weight-bold">
            {`Active ${label}:`}
          </div>,
        ],
        _.map(filters, (v, k) => (
          <div key={k}>
            <i className="ico-cancel pointer mr-4" onClick={dropColFilter(k)} />
            {`${v.query} and`}
          </div>
        ))
      );
    }
    return null;
  }

  renderBody() {
    if (this.state.loading) {
      return <Bouncer />;
    }
    return [
      <RemovableError key={0} {...this.state} onRemove={() => this.setState({ error: null, traceback: null })} />,
      <div key={1} className="row">
        <div className="col-md-7">
          <div className="row h-100">
            <div className="col-md-12 h-100">
              {this.renderColumnFilters("columnFilters", "Column Filters")}
              {this.renderColumnFilters("outlierFilters", "Outlier Filters")}
              <div className="font-weight-bold pt-3 pb-3">Custom Filter:</div>
              <textarea
                style={{ width: "100%", height: 150 }}
                value={this.state.query || ""}
                onChange={event => this.setState({ query: event.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <p className="font-weight-bold">Example queries</p>
          <ul>
            <li>
              {"drop NaN values: "}
              <span className="font-weight-bold">{"Col == Col"}</span>
            </li>
            <li>
              {"show only NaN values: "}
              <span className="font-weight-bold">{"Col != Col"}</span>
            </li>
            <li>
              {"date filtering: "}
              <span className="font-weight-bold">{`Col == '${moment().format("YYYYMMDD")}'`}</span>
            </li>
            <li>
              {"in-clause on string column: "}
              <span className="font-weight-bold">{"Col in ('foo','bar')"}</span>
            </li>
            <li>
              {"and-clause on numeric column: "}
              <span className="font-weight-bold">{"Col1 > 1 and Col2 <= 1"}</span>
            </li>
            <li>
              {"or-clause on numeric columns: "}
              <span className="font-weight-bold">{"Col1 > 1 or Col2 < 1"}</span>
            </li>
            <li>
              {"negative-clause: "}
              <span className="font-weight-bold">{"~(Col > 1)"}</span>
            </li>
            <li>
              {"parenthesis usage: "}
              <span className="font-weight-bold">{"(Col1 > 1 or Col2 < 1) and (Col3 == 3)"}</span>
            </li>
            <li>
              {"regex usage (search for substrings 'foo' or 'bar'):"}
              <br />
              <span className="font-weight-bold">{"Col.str.contains('(foo|bar)', case=False)"}</span>
            </li>
          </ul>
        </div>
      </div>,
      <div key={2} className="row">
        <div className="col-md-12">
          {this.state.contextVars && <ContextVariables contextVars={this.state.contextVars} />}
        </div>
      </div>,
    ];
  }

  render() {
    const clear = () => {
      serverState.updateSettings({ query: "" }, this.props.dataId, () => {
        if (_.startsWith(window.location.pathname, "/dtale/popup/filter")) {
          window.opener.location.reload();
          window.close();
        } else {
          this.props.chartData.propagateState({ query: "" }, this.props.onClose);
        }
      });
    };
    return [
      <div key="body" className="modal-body filter-modal">
        {this.renderBody()}
      </div>,
      <div key="footer" className="modal-footer">
        <button
          className="btn btn-secondary"
          onClick={e => {
            e.preventDefault();
            window.open(
              "https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#indexing-query",
              null,
              "titlebar=1,location=1,status=1,width=990,height=450"
            );
          }}>
          <span>Help</span>
        </button>
        <button className="btn btn-primary" onClick={clear}>
          <span>Clear</span>
        </button>
        <button className="btn btn-primary" onClick={this.save}>
          <span>Apply</span>
        </button>
      </div>,
    ];
  }
}
ReactFilter.displayName = "ReactFilter";
ReactFilter.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    propagateState: PropTypes.func,
  }),
  onClose: PropTypes.func,
};

const ReduxFilter = connect(
  state => _.pick(state, ["dataId", "chartData"]),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(ReactFilter);

export { ReactFilter, ReduxFilter as Filter, saveFilter };
