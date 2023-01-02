import * as React from 'react';

/** Component properties for CheckboxProps */
interface CheckboxProps extends React.HTMLAttributes<HTMLImageElement> {
  value: boolean;
  setter?: (value: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ value, setter, className, style, ...props }) => (
  <i
    className={`ico-check-box${value ? '' : '-outline-blank'}${setter ? ' pointer' : ''}${
      className ? ` ${className}` : ''
    }`}
    {...(setter ? { onClick: () => setter(!value), ...props } : { ...props })}
  />
);

/** Component properties for LabeledCheckbox */
interface LabeledCheckboxProps extends CheckboxProps {
  label: string;
  rowClass?: string;
  labelWidth?: number;
  inputWidth?: number;
  tooltip?: string;
}

export const LabeledCheckbox: React.FC<LabeledCheckboxProps> = ({
  label,
  labelWidth = 3,
  inputWidth = 8,
  rowClass,
  tooltip,
  ...checkboxProps
}) => (
  <div className={`form-group row ${rowClass ? `${rowClass} ` : ''}`}>
    <label className={`col-md-${labelWidth} col-form-label text-right`}>{label}</label>
    <div className={`col-md-${inputWidth} mt-auto mb-auto`}>
      {tooltip && (
        <div className="hoverable">
          <Checkbox {...checkboxProps} />
          <div className="hoverable__content">{tooltip}</div>
        </div>
      )}
      {!tooltip && <Checkbox {...checkboxProps} />}
    </div>
  </div>
);
