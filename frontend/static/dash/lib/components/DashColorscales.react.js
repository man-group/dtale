import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Colorscale, default as ColorscalePicker } from 'react-colorscales';

// Use "Viridis" as the default scale
const DEFAULT_SCALE = ['#fafa6e', '#9cdf7c', '#4abd8c', '#00968e', '#106e7c', '#2a4858'];

/**
 * DashColorscales is a Dash wrapper for `react-colorscales`.
 * It takes an array of colors, `colorscale`, and
 * displays a UI for modifying it or choosing a new scale.
 */
export default class DashColorscales extends Component {
  /** @override */
  constructor(props) {
    super(props);
    this.state = {
      showColorscalePicker: false,
      colorscale: this.props.colorscale || DEFAULT_SCALE,
    };
  }

  /** @override */
  render() {
    const { id, setProps, colorscale, nSwatches, fixSwatches } = this.props;
    const onClick = () => undefined;
    return (
      <div id={id}>
        <div
          onClick={() =>
            this.setState({
              showColorscalePicker: !this.state.showColorscalePicker,
            })
          }
        >
          <Colorscale colorscale={this.state.colorscale} onClick={onClick} width={150} />
        </div>
        {this.state.showColorscalePicker && (
          <ColorscalePicker
            colorscale={colorscale || DEFAULT_SCALE}
            nSwatches={nSwatches || DEFAULT_SCALE.length}
            fixSwatches={fixSwatches}
            onChange={(newColorscale) => {
              /*
               * Send the new value to the parent component.
               * In a Dash app, this will send the data back to the
               * Python Dash app server.
               */
              if (setProps) {
                setProps({
                  colorscale: newColorscale,
                });
              }

              this.setState({ colorscale: newColorscale });
            }}
          />
        )}
      </div>
    );
  }
}

DashColorscales.propTypes = {
  /**
   * The ID used to identify this compnent in Dash callbacks
   */
  id: PropTypes.string,

  /**
   * Optional: Initial colorscale to display. Default is Viridis.
   */
  colorscale: PropTypes.array,

  /**
   * Optional: Initial number of colors in scale to display.
   */
  nSwatches: PropTypes.number,

  /**
   * Optional: Set to `True` to fix the number of colors in the scale.
   */
  fixSwatches: PropTypes.bool,

  /**
   * Dash-assigned callback that should be called whenever any of the
   * properties change
   */
  setProps: PropTypes.func,
};
