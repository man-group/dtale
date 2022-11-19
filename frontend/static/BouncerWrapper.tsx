import * as React from 'react';

import { Bouncer } from './Bouncer';

require('./BouncerWrapper.css');

/** Component properties of BouncerWrapper */
interface BouncerWrapperProps {
  showBouncer: boolean;
}

/** Wrapper component which conditionally renders a bouncer or children */
export const BouncerWrapper: React.FC<React.PropsWithChildren<BouncerWrapperProps>> = ({ showBouncer, children }) => (
  <>
    {showBouncer ? (
      <div className="bouncer-wrapper">
        <Bouncer />
      </div>
    ) : (
      children
    )}
  </>
);
