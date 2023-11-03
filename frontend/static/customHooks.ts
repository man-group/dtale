import * as React from 'react';

/**
 * Custom hook for maintaining a reference to the pervious version of a value.
 *
 * @param value the value to maintain a reference to the previous value of.
 * @return a reference to the previous value.
 */
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = React.useRef<T>();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

/**
 * Custom hook for debouncing values that are updated often.
 *
 * @param value the value to debounce.
 * @param delay the delay between debounces.
 * @return value
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debounceValue, setDebounceValue] = React.useState(value);

  React.useEffect(() => {
    const delayMs = setTimeout(() => setDebounceValue(value), delay);
    return () => clearTimeout(delayMs);
  }, [value]);

  return debounceValue;
};

/**
 * Custom hook for ignoring the first call to a function since its noise from componentDidMount.
 *
 * @param fn the function to ignore first call to.
 * @param inputs any inputs to the function.
 */
export const useDidUpdateEffect = (fn: () => void, inputs: any[]): void => {
  const didMountRef = React.useRef(false);

  React.useEffect(() => {
    if (didMountRef.current) {
      return fn();
    }
    didMountRef.current = true;
  }, inputs);
};
