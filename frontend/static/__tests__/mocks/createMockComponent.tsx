import * as React from 'react';

/**
 * A function for creating a MockComponent class for testing.
 *
 * @param displayName display name of mocked component
 * @return mocked component
 */
export function createMockComponent(displayName?: string): React.ComponentClass<{}, {}> {
  /** @class */
  return class CustomMockComponent extends React.Component<{}, {}> {
    public static displayName = displayName ?? 'CustomMockComponent';

    /** @override */
    public render(): React.ReactNode {
      return this.props.children ?? null;
    }
  };
}
