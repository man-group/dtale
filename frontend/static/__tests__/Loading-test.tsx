import { render, screen } from '@testing-library/react';
import * as React from 'react';

import { Loading } from '../Loading';

describe('Loading', () => {
  it('renders default loading message', () => {
    render(<Loading />);
    expect(screen.getByText('Loading')).toBeDefined();
  });

  it('renders custom loading message', () => {
    render(<Loading message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeDefined();
  });
});
