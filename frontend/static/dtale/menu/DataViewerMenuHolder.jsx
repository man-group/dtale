import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { openMenu } from '../../menuUtils';
import * as gu from '../gridUtils';

class ReactDataViewerMenuHolder extends React.Component {
  constructor(props) {
    super(props);
    this.menuToggle = React.createRef();
  }

  render() {
    const { style, propagateState, menuOpen, menuPinned, rowCount, theme, columns, backgroundMode } = this.props;
    const activeCols = gu.getActiveCols({ columns, backgroundMode });
    const menuHandler = openMenu(
      () => propagateState({ menuOpen: true }),
      () => propagateState({ menuOpen: false }),
      this.menuToggle,
    );
    return (
      <div ref={this.menuToggle} style={style} className="menu-toggle">
        <div className="crossed">
          {!menuPinned && (
            <div
              className={`grid-menu ${menuOpen ? 'open' : ''}`}
              style={{
                background: gu.isLight(theme) ? 'white' : 'black',
                color: gu.isLight(theme) ? 'black' : 'white',
              }}
              onClick={menuHandler}
            >
              <span>&#8227;</span>
            </div>
          )}
          <div className="rows">{rowCount ? rowCount - 1 : 0}</div>
          <div className="cols">{activeCols.length ? activeCols.length - 1 : 0}</div>
        </div>
      </div>
    );
  }
}
ReactDataViewerMenuHolder.displayName = 'ReactDataViewerMenuHolder';
ReactDataViewerMenuHolder.propTypes = {
  style: PropTypes.object,
  theme: PropTypes.string,
  columns: PropTypes.arrayOf(PropTypes.object),
  backgroundMode: PropTypes.string,
  menuOpen: PropTypes.bool,
  menuPinned: PropTypes.bool,
  rowCount: PropTypes.number,
  propagateState: PropTypes.func,
};

const ReduxDataViewerMenuHolder = connect(({ theme, menuPinned }) => ({
  theme,
  menuPinned,
}))(ReactDataViewerMenuHolder);
export { ReduxDataViewerMenuHolder as DataViewerMenuHolder, ReactDataViewerMenuHolder };
