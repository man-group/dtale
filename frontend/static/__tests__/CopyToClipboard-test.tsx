import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';

import CopyToClipboard, { ButtonBuilderProps } from '../CopyToClipboard';

import { buildInnerHTML } from './test-utils';

describe('CopyToClipboard tests', () => {
  const render = (): ReactWrapper => {
    buildInnerHTML();
    const buttonBuilder = (props: ButtonBuilderProps): JSX.Element => (
      <div id="clicker" {...props}>
        Hello
      </div>
    );
    const result = mount(<CopyToClipboard text="test code" buttonBuilder={buttonBuilder} />, {
      attachTo: document.getElementById('content') ?? undefined,
    });
    result.render();
    return result;
  };

  it('CopyToClipboard no queryCommandSupported test', () => {
    const result = render();
    expect(result.html()).toBeNull();
  });

  it('CopyToClipboard queryCommandSupported test', () => {
    Object.defineProperty(global.document, 'queryCommandSupported', {
      value: () => true,
    });
    Object.defineProperty(global.document, 'execCommand', { value: () => ({}) });
    const result = render();
    expect(result.find('#clicker').length).toBe(1);
    result.find('#clicker').simulate('click');
  });
});
