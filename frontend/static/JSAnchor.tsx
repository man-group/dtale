import * as React from 'react';

/** Component properties for JSAnchor */
interface JSAnchorProps {
  id?: string;
  className?: string;
  onClick?: (e: React.FormEvent<HTMLAnchorElement>) => void;
  title?: string;
}

/** Wrapper class for setting onClick on HTML anchor tags */
export const JSAnchor: React.FC<React.PropsWithChildren<JSAnchorProps>> = ({ onClick, children, ...otherProps }) => {
  /**
   * Click handler which executes any onClick function provided in component properties.
   *
   * @param e click event
   */
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault();
    onClick?.(e);
  };

  return (
    <a href="#" onClick={handleClick} {...otherProps}>
      {children}
    </a>
  );
};
