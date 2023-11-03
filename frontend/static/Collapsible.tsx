import React from 'react';

require('./Collapsible.scss');

/** Component properties of Collapsible */
interface CollapsibleProps {
  title: React.ReactNode;
  content: React.ReactNode;
  onExpand?: () => void;
}

const Collapsible: React.FC<CollapsibleProps> = ({ title, content, onExpand }) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    onExpand?.();
  }, [isOpen]);

  if (!content) {
    return null;
  }
  const onClick: () => void = (): void => setIsOpen(!isOpen);
  return (
    <dl className="accordion pt-3">
      <dt className={`accordion-title${isOpen ? ' is-expanded' : ''} pointer pl-3`} onClick={onClick}>
        {title}
      </dt>
      <dd className={`accordion-content${isOpen ? ' is-expanded' : ''}`} onClick={onClick}>
        {content}
      </dd>
    </dl>
  );
};

export default Collapsible;
