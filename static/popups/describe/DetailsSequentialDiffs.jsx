import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import ButtonToggle from "../../ButtonToggle";
import { RemovableError } from "../../RemovableError";
import { buildURLString, sequentialDiffsUrl } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import { buildStat } from "./detailUtils";

const sortOptions = t => [
  { label: t("None"), value: null },
  { label: t("Asc"), value: "ASC" },
  { label: t("Desc"), value: "DESC" },
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
    fetchJson(buildURLString(sequentialDiffsUrl(dataId), { col: column, sort }), data => {
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
    const { data, t } = this.props;
    const { sort, sortedDiffs } = this.state;
    const currData = sort === null ? data : sortedDiffs[sort];

    const updateSort = value => this.loadSortedDiffs(value);
    return (
      <React.Fragment>
        {this.state.error}
        <li>
          <div>
            <h4 className="d-inline">Sequential Diffs</h4>
            <ButtonToggle options={sortOptions(t)} update={updateSort} defaultValue={this.state.sort} />
          </div>
          <ul>
            <li>{buildStat(t, "Min", currData.min)}</li>
            <li>{buildStat(t, "Average", currData.avg)}</li>
            <li>{buildStat(t, "Max", currData.max)}</li>
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
  t: PropTypes.func,
};
const TranslateReactDetailsSequentialDiffs = withTranslation("describe")(ReactDetailsSequentialDiffs);
const ReduxDetailsSequentialDiffs = connect(({ dataId }) => ({ dataId }))(TranslateReactDetailsSequentialDiffs);
export {
  ReduxDetailsSequentialDiffs as DetailsSequentialDiffs,
  TranslateReactDetailsSequentialDiffs as ReactDetailsSequentialDiffs,
};
