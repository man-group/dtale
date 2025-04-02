import React from 'react';

import '../i18n';

import { Base } from './Base';
import { CodePopup } from './CodePopup';
import { Popup } from './Popup';

require('../publicPath');

/** Popup component properties */
interface AppProps {
  pathname: string;
}
const App: React.FC<AppProps> = ({ pathname }) => {
  if (pathname.startsWith('/dtale/popup')) {
    return <Popup pathname={pathname} />;
  }
  if (pathname.startsWith('/dtale/code-popup')) {
    return <CodePopup />;
  }
  return <Base />;
};

export default App;
