import * as React from 'react';

/**
 * Custom hook for maintaining a reference to the pervious version of a value.
 *
 * @param value the value to maintain a reference to the previous value of.
 * @return a reference to the previous value.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T>();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
