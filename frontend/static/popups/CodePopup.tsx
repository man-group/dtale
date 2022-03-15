import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { default as python } from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { default as docco } from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';

SyntaxHighlighter.registerLanguage('python', python);

import { ButtonBuilderProps, canCopy, default as CopyToClipboard } from '../CopyToClipboard';
import * as menuFuncs from '../dtale/menu/dataViewerMenuUtils';
import { JSAnchor } from '../JSAnchor';

require('./CodePopup.css');

export const renderCodePopupAnchor = (code: string, title: string): JSX.Element => {
  const onClick = (): void => {
    (window as any).code_popup = { code, title };
    menuFuncs.open('/dtale/code-popup', undefined, 450, 700);
  };
  return (
    <JSAnchor onClick={onClick}>
      <i className="ico-code pr-3" />
      <span>Code Export</span>
    </JSAnchor>
  );
};

/** Component properties for CodePopup */
interface CodePopupProps {
  code?: string;
}

const CodePopup: React.FC<CodePopupProps & WithTranslation> = ({ code, t }) => {
  const renderCopyToClipboard = (): React.ReactNode => {
    if (canCopy()) {
      const buttonBuilder = (props: ButtonBuilderProps): JSX.Element => (
        <button className="btn btn-primary" {...props}>
          <i className="far fa-copy pr-3" />
          <span>{t('Copy')}</span>
        </button>
      );
      return (
        <div key="footer" className="modal-footer">
          <CopyToClipboard text={code} buttonBuilder={buttonBuilder} tooltipPosition="top" />
        </div>
      );
    }
    return null;
  };

  return (
    <React.Fragment>
      <div className="modal-body code-popup-modal">
        <SyntaxHighlighter language="python" style={docco}>
          {code ?? ''}
        </SyntaxHighlighter>
      </div>
      {renderCopyToClipboard()}
    </React.Fragment>
  );
};

export default withTranslation('code_export')(CodePopup);
