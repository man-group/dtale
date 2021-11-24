import * as React from 'react';
import { TFunction, withTranslation } from 'react-i18next';

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
interface ButtonBuilderProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/** Component properties for CopyToClipboard */
interface CopyToClipboardProps {
  text?: string;
  buttonBuilder: (props: ButtonBuilderProps) => React.Component<HTMLButtonElement>;
  tooltipPosition?: string;
  t: TFunction;
}

/** Component for creating a button which when clicked will copy the contents of a string to the clipboard. */
class CopyToClipboard extends React.Component<CopyToClipboardProps> {
  private readonly textArea: React.RefObject<HTMLTextAreaElement>;
  private readonly tooltip: React.RefObject<HTMLDivElement>;

  /** @override */
  constructor(props: CopyToClipboardProps) {
    super(props);
    this.textArea = React.createRef<HTMLTextAreaElement>();
    this.tooltip = React.createRef<HTMLDivElement>();
  }

  /** @override */
  public render(): React.ReactNode {
    if (canCopy()) {
      const copy = (e: React.MouseEvent<HTMLButtonElement>): void => {
        this.textArea.current?.select?.();
        document.execCommand('copy');
        (e.target as HTMLElement).focus();
        const currTooltip = this.tooltip.current;
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
            ref={this.textArea}
            style={{ position: 'absolute', left: -1 * window.innerWidth }}
            value={this.props.text || ''}
            onChange={() => undefined}
          />
          <div className="hoverable-click">
            {this.props.buttonBuilder({ onClick: copy })}
            <div ref={this.tooltip} className={`hoverable__content copy-tt-${this.props.tooltipPosition} fade-out`}>
              {this.props.t('Copied to clipboard')}
            </div>
          </div>
        </React.Fragment>
      );
    }
    return null;
  }
}

const TranslateCopyToClipboard = withTranslation('constants')(CopyToClipboard);
export { TranslateCopyToClipboard as CopyToClipboard };
