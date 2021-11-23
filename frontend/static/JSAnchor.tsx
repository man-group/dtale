import * as _ from 'lodash';
import * as React from 'react';

/** Component properties for JSAnchor */
interface JSAnchorProps {
  id?: string;
  className?: string;
  onClick?: (e: React.FormEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
  title?: string;
}

/** Wrapper class for setting onClick on HTML anchor tags */
export class JSAnchor extends React.Component<JSAnchorProps> {
  /** @override */
  constructor(props: JSAnchorProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  /** @override */
  public render(): React.ReactNode {
    return (
      <a href="#" onClick={this.handleClick} {..._.omit(this.props, ['children', 'onClick'])}>
        {this.props.children}
      </a>
    );
  }

  /**
   * Click handler which executes any onClick function provided in component properties.
   *
   * @param e click event
   */
  private handleClick(e: React.MouseEvent<HTMLAnchorElement>): void {
    e.preventDefault();
    if (this.props.onClick) {
      this.props.onClick(e);
    }
  }
}
