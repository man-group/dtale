import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';

import { RemovableError } from '../../RemovableError';
import CorrelationsGrid from '../correlations/CorrelationsGrid';
import * as corrUtils from '../correlations/correlationsUtils';
import * as CorrelationsRepository from '../../repository/CorrelationsRepository';
import { BouncerWrapper } from '../../BouncerWrapper';
import { default as PPSDetails, displayScore } from './PPSDetails';

class PredictivePowerScore extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      correlations: null,
      selectedCols: [],
      hasDate: false,
      loadingPps: true,
    };
    this.loadGrid = this.loadGrid.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }
    const stateProps = ['error', 'correlations', 'selectedCols', 'encodeStrings', 'loadingPps'];
    if (!_.isEqual(_.pick(this.state, stateProps), _.pick(newState, stateProps))) {
      return true;
    }
    return false;
  }

  async loadGrid() {
    const response = await CorrelationsRepository.loadCorrelations(this.props.dataId, this.state.encodeStrings, true);
    if (response?.error) {
      this.setState({ loadingPps: false, error: <RemovableError {...response} /> });
      return;
    }
    if (response) {
      const { data, pps, strings } = response;
      const columns = _.map(data, 'column');
      const state = {
        correlations: data,
        pps,
        columns,
        strings,
        loadingPps: false,
      };
      this.setState(state, () => {
        const { col1, col2 } = corrUtils.findCols(this.props.chartData, columns);
        this.setState({ selectedCols: [col1, col2] });
      });
    }
  }

  componentDidMount() {
    this.loadGrid();
  }

  componentDidUpdate(_prevProps, prevState) {
    if (this.state.encodeStrings !== prevState.encodeStrings) {
      this.loadGrid();
    }
  }

  render() {
    const { t } = this.props;
    const { error, pps, selectedCols } = this.state;
    const ppsInfo = _.find(pps, { x: selectedCols?.[0], y: selectedCols?.[1] });
    return (
      <div key="body" className="modal-body scatter-body">
        {error}
        {!error && (
          <BouncerWrapper showBouncer={this.state.loadingPps}>
            <CorrelationsGrid
              buildScatter={(selectedCols) => this.setState({ selectedCols })}
              selectedCols={selectedCols}
              colorScale={corrUtils.ppsScale}
              isPPS={true}
              {...this.state}
              toggleStrings={() => this.setState({ encodeStrings: !this.state.encodeStrings })}
            />
            {ppsInfo !== undefined && (
              <React.Fragment>
                <h2 className="pt-5">
                  {`${t('Prediction Power Score for', { ns: 'pps' })} ${ppsInfo.x} `}
                  {`${t('vs.', { ns: 'correlations' })} ${ppsInfo.y}: ${displayScore(ppsInfo)}`}
                </h2>
                <PPSDetails ppsInfo={ppsInfo} />
              </React.Fragment>
            )}
          </BouncerWrapper>
        )}
      </div>
    );
  }
}
PredictivePowerScore.displayName = 'PredictivePowerScore';
PredictivePowerScore.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    query: PropTypes.string,
    title: PropTypes.string,
    col1: PropTypes.string,
    col2: PropTypes.string,
  }),
  propagateState: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(['pps', 'correlations'])(PredictivePowerScore);
