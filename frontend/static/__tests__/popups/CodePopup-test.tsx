import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';

import * as CopyToClipboard from '../../CopyToClipboard';
import * as menuFuncs from '../../dtale/menu/dataViewerMenuUtils';
import { default as CodePopup, renderCodePopupAnchor } from '../../popups/CodePopup';
import { buildInnerHTML } from '../test-utils';

describe('CodePopup tests', () => {
  beforeAll(() => {
    Object.defineProperty(global.document, 'queryCommandSupported', {
      value: () => true,
    });
    Object.defineProperty(global.document, 'execCommand', { value: () => ({}) });
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('CodePopup render & copy test', async () => {
    buildInnerHTML();
    const result = render(<CodePopup code="test code" />, {
      container: document.getElementById('content') ?? undefined,
    }).container;
    expect(result.getElementsByClassName('code-popup-modal')[0].textContent).toBe('test code');
    await act(async () => {
      await fireEvent.click(screen.getByText('Copy'));
    });
  });

  it("returns null when it can't copy", () => {
    buildInnerHTML();
    const canCopySpy = jest.spyOn(CopyToClipboard, 'canCopy');
    canCopySpy.mockImplementation(() => false);
    const result = render(<CodePopup code="test code" />, {
      container: document.getElementById('content') ?? undefined,
    }).container;
    expect(result.getElementsByTagName('div')).toHaveLength(1);
  });

  describe('renderCodePopupAnchor', () => {
    let menuFuncsOpenSpy: jest.SpyInstance;

    beforeEach(() => {
      menuFuncsOpenSpy = jest.spyOn(menuFuncs, 'open');
      menuFuncsOpenSpy.mockImplementation(() => undefined);
    });

    afterEach(jest.resetAllMocks);

    afterAll(jest.restoreAllMocks);

    it('onClick implemntation', async () => {
      const code = 'test code';
      const title = 'test';
      const popupAnchor = renderCodePopupAnchor(code, title);
      const result = render(popupAnchor).container;
      await act(async () => {
        await fireEvent.click(result.getElementsByTagName('a')[0]);
      });
      expect(menuFuncsOpenSpy).toHaveBeenCalledWith('/dtale/code-popup', undefined, 450, 700);
      expect((window as any).code_popup).toEqual({ code, title });
    });
  });
});
