/* istanbul ignore file */
import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';

import App from './app';

let pathname = window.location.pathname;
if ((window as any).resourceBaseUrl) {
  pathname = pathname.replace((window as any).resourceBaseUrl, '');
}

const rootId =
  pathname.startsWith('/dtale/popup') || pathname.startsWith('/dtale/code-popup') ? 'popup-content' : 'content';
const root = ReactDOMClient.createRoot(document.getElementById(rootId)!);
root.render((<App pathname={pathname} />) as any);
