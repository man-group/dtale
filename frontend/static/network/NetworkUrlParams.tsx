import * as React from 'react';

import * as actions from '../redux/actions/dtale';

import { NetworkDisplayState } from './NetworkState';

const DATA_PROPS = ['to', 'from', 'weight', 'group'];

/** Component properties for NetworkUrlParams */
export interface NetworkUrlParamsProps {
  params: Record<string, string>;
  propagateState: (state: NetworkDisplayState) => void;
}

export const NetworkUrlParams: React.FC<NetworkUrlParamsProps> = ({ params, propagateState }) => {
  const oldOnPopState = React.useRef<typeof window.onpopstate>(window.onpopstate);

  const callOnChangeFunctions = (): void => {
    const currParams = actions.getParams();
    const newState = DATA_PROPS.reduce((res, key) => {
      const urlValue = currParams[key];
      return { ...res, [key]: urlValue ? { value: urlValue } : undefined };
    }, {});
    propagateState(newState as NetworkDisplayState);
  };

  React.useEffect(() => {
    window.onpopstate = (event) => {
      callOnChangeFunctions();

      // Call any other onpopstate handlers.
      if (oldOnPopState.current) {
        oldOnPopState.current.call(window, event);
      }
    };

    return () => {
      window.onpopstate = oldOnPopState.current;
    };
  }, []);

  React.useEffect(() => {
    const urlParams = actions.getParams();
    const shouldUpdateUrl = DATA_PROPS.find((key) => params?.[key] !== urlParams[key]);

    if (shouldUpdateUrl) {
      history.pushState({}, '', `?${new URLSearchParams(params).toString()}`);
    }
  }, [params]);

  return null;
};
