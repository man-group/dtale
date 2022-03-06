import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

/** Expected types for code input */
export type CreateColumnCodeSnippet = string | string[] | undefined;

/** Component properties for CodeSnippet */
interface CodeSnippetProps {
  code: CreateColumnCodeSnippet;
  isWindow?: boolean;
}

const CodeSnippet: React.FC<CodeSnippetProps & WithTranslation> = ({ code, isWindow, t }) => {
  const codeMarkup = React.useMemo(() => {
    if (code) {
      const codeArr = Array.isArray(code) ? code : [code];
      if (codeArr.length > 2) {
        return (
          <div className="font-weight-bold hoverable">
            <div>{codeArr[0]}</div>
            <div>{codeArr[1]}</div>
            <div style={{ fontSize: '85%' }}>{t('hover to see more...', { ns: 'builders' })}</div>
            <div className={`hoverable__content build-code${isWindow ? '-window' : ''}`}>
              <pre className="mb-0">{codeArr.join('\n')}</pre>
            </div>
          </div>
        );
      } else {
        return (
          <div className="font-weight-bold">
            {codeArr.map((c, i) => (
              <div key={i}>{c}</div>
            ))}
          </div>
        );
      }
    }
    return null;
  }, [code]);

  if (!code) {
    return null;
  }

  return (
    <React.Fragment>
      <div className="col-auto" style={{ paddingRight: 0 }}>
        <span className="pr-3">{t('Code', { ns: 'reshape' })}:</span>
        {codeMarkup}
      </div>
      <div className="col" />
    </React.Fragment>
  );
};

export default withTranslation(['reshape', 'builders'])(CodeSnippet);
