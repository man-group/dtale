import * as React from 'react';

/** Option for ButtonToggle */
export interface ButtonToggleOption {
  label?: string;
  value: any;
  buttonOptions?: Partial<React.HTMLAttributes<HTMLButtonElement>>;
}

/** Component properties for ButtonToggle */
interface ButtonToggleProps {
  options: ButtonToggleOption[];
  update: (value?: any) => void;
  defaultValue?: any;
  allowDeselect?: boolean;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

/** Class for defining a Bootstrap-style button toggle */
const ButtonToggle: React.FC<ButtonToggleProps> = ({
  options,
  update,
  defaultValue,
  allowDeselect,
  disabled,
  className,
  compact,
}) => {
  const [active, setActive] = React.useState<any | undefined>(defaultValue);

  React.useEffect(() => {
    if (defaultValue !== active) {
      setActive(defaultValue);
    }
  }, [defaultValue]);

  return (
    <div className={`btn-group${(compact ?? true) === true ? ' compact' : ''} col-auto ${className ?? ''}`}>
      {options.map(({ label, value }, idx) => {
        let buttonClass = 'btn btn-primary';
        let onClick;
        if (value === active) {
          buttonClass += ' active';
          if (allowDeselect ?? false) {
            onClick = () => {
              setActive(undefined);
              update(undefined);
            };
          }
        } else {
          buttonClass += ' inactive';
          onClick = () => {
            setActive(value);
            update(value);
          };
        }
        return (
          <button key={idx} className={buttonClass} onClick={onClick} disabled={disabled ?? false}>
            {label ?? value}
          </button>
        );
      })}
    </div>
  );
};

export default ButtonToggle;
