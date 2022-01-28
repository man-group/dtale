import * as React from 'react';

/** Option for ButtonToggle */
export interface ButtonToggleOption {
  label?: React.ReactNode;
  value: any;
  buttonOptions?: Partial<React.HTMLAttributes<HTMLButtonElement>>;
  className?: string;
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
  style?: Partial<React.CSSProperties>;
}

/** Class for defining a Bootstrap-style button toggle */
const ButtonToggle: React.FC<ButtonToggleProps> = ({
  options,
  update,
  defaultValue,
  allowDeselect,
  disabled,
  className = 'col-auto',
  compact = true,
  style,
}) => {
  const [active, setActive] = React.useState<any | undefined>(defaultValue);

  React.useEffect(() => {
    if (defaultValue !== active) {
      setActive(defaultValue);
    }
  }, [defaultValue]);

  return (
    <div className={`btn-group${compact === true ? ' compact' : ''} ${className}`} style={style}>
      {options.map((option, idx) => {
        let buttonClass = 'btn btn-primary';
        let onClick;
        if (option.value === active) {
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
            setActive(option.value);
            update(option.value);
          };
        }
        buttonClass += option.className ? ` ${option.className}` : '';
        return (
          <button
            key={idx}
            className={buttonClass}
            onClick={onClick}
            disabled={disabled ?? false}
            {...option.buttonOptions}
          >
            {option.label ?? option.value}
          </button>
        );
      })}
    </div>
  );
};

export default ButtonToggle;
