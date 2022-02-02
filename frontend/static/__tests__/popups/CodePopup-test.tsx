import { mount } from 'enzyme';
import _ from 'lodash';
import React from 'react';

import * as CopyToClipboard from '../../CopyToClipboard';
import * as menuFuncs from '../../dtale/menu/dataViewerMenuUtils';
import { default as CodePopup, renderCodePopupAnchor } from '../../popups/CodePopup';
import { buildInnerHTML } from '../test-utils';

describe('CodePopup tests', () => {
  beforeAll(() => {
    Object.defineProperty(global.document, 'queryCommandSupported', {
      value: () => true,
    });
    Object.defineProperty(global.document, 'execCommand', { value: _.noop });
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('CodePopup render & copy test', () => {
    buildInnerHTML();
    const result = mount(<CodePopup code="test code" />, {
      attachTo: document.getElementById('content') ?? undefined,
    });
    result.render();
    expect(result.find('pre').text()).toBe('test code');
    result.find('button').simulate('click');
  });

  it("returns null when it can't copy", () => {
    buildInnerHTML();
    const canCopySpy = jest.spyOn(CopyToClipboard, 'canCopy');
    canCopySpy.mockImplementation(() => false);
    const result = mount(<CodePopup code="test code" />, {
      attachTo: document.getElementById('content') ?? undefined,
    });
    result.render();
    expect(result.find('div')).toHaveLength(1);
  });

  describe('renderCodePopupAnchor', () => {
    let menuFuncsOpenSpy: jest.SpyInstance;

    beforeEach(() => {
      menuFuncsOpenSpy = jest.spyOn(menuFuncs, 'open');
      menuFuncsOpenSpy.mockImplementation(() => undefined);
    });

    afterEach(jest.resetAllMocks);

    afterAll(jest.restoreAllMocks);

    it('onClick implemntation', () => {
      const code = 'test code';
      const title = 'test';
      const popupAnchor = renderCodePopupAnchor(code, title);
      const result = mount(popupAnchor);
      result.simulate('click');
      expect(menuFuncsOpenSpy).toHaveBeenCalledWith('/dtale/code-popup', undefined, 450, 700);
      expect((window as any).code_popup).toEqual({ code, title });
    });
  });
});
