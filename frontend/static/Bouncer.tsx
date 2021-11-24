import * as React from 'react';

// Based on http://tobiasahlin.com/spinkit/
require('./Bouncer.css');

export const Bouncer: React.FC = () => (
  <div className="bouncer">
    <div className="double-bounce1" />
    <div className="double-bounce2" />
  </div>
);
