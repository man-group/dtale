import * as React from 'react';

// Based on http://tobiasahlin.com/spinkit/
require('./Loading.css');

/** Component properties for Loading */
interface LoadingProps {
  message?: string;
}

/** Simple loading spinner component */
export const Loading: React.FC<LoadingProps> = ({ message }) => <div className="loading">{message ?? 'Loading'}</div>;
