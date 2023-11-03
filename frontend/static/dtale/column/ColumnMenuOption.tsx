import * as React from 'react';

/** Component properties of ColumnMenuOption */
interface ColumnMenuOptionProps {
  open: () => void;
  label: React.ReactNode;
  iconClass: string;
}

export const ColumnMenuOption: React.FC<ColumnMenuOptionProps> = ({ open, label, iconClass }) => (
  <li onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className={iconClass} />
        <span className="font-weight-bold">{label}</span>
      </button>
    </span>
  </li>
);
