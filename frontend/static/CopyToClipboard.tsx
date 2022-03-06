import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

require('./CopyToClipboard.css');

/**
 * Determines whether the copy command is supported in this browser.
 *
 * @return true if browser supports copy, false otherwise.
 */
export function canCopy(): boolean {
  return document.queryCommandSupported && document.queryCommandSupported('copy');
}

/** Component properties for button building */
export interface ButtonBuilderProps {
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}

/** Component properties for CopyToClipboard */
interface CopyToClipboardProps {
  text?: string;
  buttonBuilder: (props: ButtonBuilderProps) => JSX.Element;
  tooltipPosition?: string;
}

/** Component for creating a button which when clicked will copy the contents of a string to the clipboard. */
const CopyToClipboard: React.FC<CopyToClipboardProps & WithTranslation> = ({
  text,
  buttonBuilder,
  tooltipPosition,
  t,
}) => {
  const textArea = React.useRef<HTMLTextAreaElement>(null);
  const tooltip = React.useRef<HTMLDivElement>(null);

  if (canCopy()) {
    const copy = (e: React.MouseEvent<HTMLElement>): void => {
      textArea.current?.select?.();
      document.execCommand('copy');
      (e.target as HTMLElement).focus();
      const currTooltip = tooltip.current;
      if (currTooltip) {
        const origClasses = currTooltip.className.split(' ').filter((className: string) => className !== 'fade-out');
        currTooltip.className = [...origClasses, 'fade-in'].join(' ');
        setTimeout(() => {
          currTooltip.className = [...origClasses, 'fade-out'].join(' ');
        }, 300);
      }
    };
    return (
      <React.Fragment>
        <textarea
          ref={textArea}
          style={{ position: 'absolute', left: -1 * window.innerWidth }}
          value={text || ''}
          onChange={() => undefined}
        />
        <div className="hoverable-click">
          {buttonBuilder({ onClick: copy })}
          <div ref={tooltip} className={`hoverable__content copy-tt-${tooltipPosition} fade-out`}>
            {t('Copied to clipboard')}
          </div>
        </div>
      </React.Fragment>
    );
  }
  return null;
};

export default withTranslation('constants')(CopyToClipboard);
