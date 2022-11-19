import React from 'react';

/** Component properties for RemovableError */
interface RemovableErrorProps {
  error?: string | null;
  traceback?: string;
  onRemove?: () => void;
}

/** Simple component for display error messages and their possible traceback */
export const RemovableError: React.FC<React.PropsWithChildren<RemovableErrorProps>> = ({
  error,
  traceback,
  onRemove,
  children,
}) => (
  <>
    {error && (
      <div className="dtale-alert alert alert-danger" role="alert">
        <i className="ico-error" />
        <span>{error}</span>
        {onRemove && <i className="ico-cancel float-right" onClick={onRemove} />}
        {traceback && (
          <div className="traceback">
            <pre>{traceback}</pre>
          </div>
        )}
        {children}
      </div>
    )}
  </>
);
