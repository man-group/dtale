import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import ButtonToggle from "../../ButtonToggle";
import { RemovableError } from "../../RemovableError";
import { fetchJson } from "../../fetcher";
import { buildStat } from "./detailUtils";

const SORT_OPTIONS = [
  { label: "None", value: null },
  { label: "Asc", value: "ASC" },
  { label: "Desc", value: "DESC" },
];

class ReactDetailsSequentialDiffs extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sort: null, sortedDiffs: {}, error: null };
    this.loadSortedDiffs = this.loadSortedDiffs.bind(this);
  }

  componentDidUpdate(nextProps) {
    if (this.props.column !== nextProps.column) {
      this.setState({ sortedDiffs: {}, sort: null, error: null });
    }
  }

  loadSortedDiffs(sort) {
    if (_.has(this.state.sortedDiffs, sort)) {
      this.setState({ sort });
      return;
    }
    const { dataId, column } = this.props;
    fetchJson(`/dtale/sorted-sequential-diffs/${dataId}/${column}/${sort}`, data => {
      if (data.error) {
        this.setState({
          error: <RemovableError {...data} />,
        });
        return;
      }
      const updatedSortedDiffs = { ...this.state.sortedDiffs, [sort]: data };
      this.setState({ sortedDiffs: updatedSortedDiffs, sort, error: null });
    });
  }

  render() {
    const { data } = this.props;
    const { sort, sortedDiffs } = this.state;
    const currData = sort === null ? data : sortedDiffs[sort];

    const updateSort = value => this.loadSortedDiffs(value);
    return (
      <React.Fragment>
        {this.state.error}
        <li>
          <div>
            <h4 className="d-inline">Sequential Diffs</h4>
            <ButtonToggle options={SORT_OPTIONS} update={updateSort} defaultValue={this.state.sort} />
          </div>
          <ul>
            <li>{buildStat("Min", currData.min)}</li>
            <li>{buildStat("Average", currData.avg)}</li>
            <li>{buildStat("Max", currData.max)}</li>
          </ul>
        </li>
      </React.Fragment>
    );
  }
}
ReactDetailsSequentialDiffs.displayName = "ReactDetailsSequentialDiffs";
ReactDetailsSequentialDiffs.propTypes = {
  data: PropTypes.object,
  dataId: PropTypes.string,
  column: PropTypes.string,
};

const ReduxDetailsSequentialDiffs = connect(({ dataId }) => ({ dataId }))(ReactDetailsSequentialDiffs);

export { ReduxDetailsSequentialDiffs as DetailsSequentialDiffs, ReactDetailsSequentialDiffs };
