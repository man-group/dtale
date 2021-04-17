import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";

export default class ColumnNavigation extends React.Component {
  constructor(props) {
    super(props);
    this.up = this.up.bind(this);
    this.down = this.down.bind(this);
  }

  up() {
    const { dtypes, selected, propagateState } = this.props;
    if (selected?.index < _.size(dtypes) - 1) {
      propagateState({
        selected: _.find(dtypes, { index: selected.index + 1 }),
      });
    }
  }

  down() {
    const { dtypes, selected, propagateState } = this.props;
    if (selected?.index > 0) {
      propagateState({
        selected: _.find(dtypes, { index: selected.index - 1 }),
      });
    }
  }

  render() {
    return (
      <GlobalHotKeys keyMap={{ COL_UP: "up", COL_DOWN: "down" }} handlers={{ COL_UP: this.up, COL_DOWN: this.down }} />
    );
  }
}
ColumnNavigation.displayName = "ColumnNavigation";
ColumnNavigation.propTypes = {
  dtypes: PropTypes.arrayOf(PropTypes.object),
  selected: PropTypes.object,
  propagateState: PropTypes.func,
};
