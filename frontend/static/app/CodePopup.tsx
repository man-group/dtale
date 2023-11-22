import React from 'react';

import { default as Content } from '../popups/CodePopup';

require('../dtale/DataViewer.css');

export const CodePopup: React.FC = () => {
  React.useEffect(() => {
    const titleElement: HTMLElement | null = document.getElementById('code-title');
    if (!titleElement) {
      return;
    }
    if (window.opener) {
      titleElement.innerHTML = `${window.opener.code_popup.title} Code Export`;
    } else {
      titleElement.innerHTML = 'Code Missing';
    }
  }, []);

  if (window.opener) {
    return <Content code={window.opener.code_popup.code} />;
  }
  return <h1>No parent window containing code detected!</h1>;
};
