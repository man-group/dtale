import * as React from 'react';

/** Type definition for ButtonToggle option value */
type ButtonToggleOptionValue = string | number | boolean | null;

/** Option for ButtonToggle */
interface ButtonToggleOption {
  label?: string;
  value: ButtonToggleOptionValue;
}

/** Component properties for ButtonToggle */
interface ButtonToggleProps {
  options: ButtonToggleOption[];
  update: (value: ButtonToggleOptionValue) => void;
  defaultValue?: ButtonToggleOptionValue;
  allowDeselect?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Class for defining a Bootstrap-style button toggle */
const ButtonToggle: React.FC<ButtonToggleProps> = ({
  options,
  update,
  defaultValue,
  allowDeselect,
  disabled,
  className,
}) => {
  const [active, setActive] = React.useState<ButtonToggleOptionValue | undefined>(defaultValue);

  React.useEffect(() => {
    if (defaultValue !== active) {
      setActive(defaultValue);
    }
  }, [defaultValue]);

  React.useEffect(() => {
    update(active ?? null);
  }, [active]);

  return (
    <div className={`btn-group compact col-auto ${className ?? ''}`}>
      {options.map(({ label, value }, idx) => {
        let buttonClass = 'btn btn-primary';
        let onClick;
        if (value === active) {
          buttonClass += ' active';
          if (allowDeselect ?? false) {
            onClick = () => setActive(null);
          }
        } else {
          buttonClass += ' inactive';
          onClick = () => setActive(value);
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
