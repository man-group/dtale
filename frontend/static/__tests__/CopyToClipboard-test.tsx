import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import CopyToClipboard, { ButtonBuilderProps } from '../CopyToClipboard';

import { buildInnerHTML } from './test-utils';

describe('CopyToClipboard tests', () => {
  const buildMock = (): HTMLElement => {
    buildInnerHTML();
    const buttonBuilder = (props: ButtonBuilderProps): JSX.Element => (
      <div id="clicker" {...props}>
        Hello
      </div>
    );
    return render(<CopyToClipboard text="test code" buttonBuilder={buttonBuilder} />, {
      container: document.getElementById('content') ?? undefined,
    }).container;
  };

  it('CopyToClipboard no queryCommandSupported test', () => {
    const result = buildMock();
    expect(result.innerHTML).toBe('');
  });

  it('CopyToClipboard queryCommandSupported test', () => {
    Object.defineProperty(global.document, 'queryCommandSupported', {
      value: () => true,
    });
    Object.defineProperty(global.document, 'execCommand', { value: () => ({}) });
    buildMock();
    expect(document.getElementById('clicker')).toBeDefined();
    fireEvent.click(document.getElementById('clicker')!);
  });
});
