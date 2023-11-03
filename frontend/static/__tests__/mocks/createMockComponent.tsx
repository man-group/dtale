import * as React from 'react';

/**
 * A function for creating a MockComponent class for testing.
 *
 * @param displayName display name of mocked component
 * @param renderFn A function that can be used to render the mock. If omitted, only the children will be rendered (if they exist)
 * @return A mock react component class
 */
export function createMockComponent<P = Record<string, unknown>>(
  displayName?: string,
  renderFn?: (props: P) => React.ReactNode,
): React.ComponentClass<React.PropsWithChildren<P>> {
  /** @class */
  return class CustomMockComponent extends React.Component<React.PropsWithChildren<P>, Record<string, unknown>> {
    public static displayName = displayName ?? 'CustomMockComponent';

    /** @override */
    public render(): React.ReactNode {
      if (renderFn) {
        return renderFn(this.props);
      }
      return this.props.children ?? null;
    }
  };
}
