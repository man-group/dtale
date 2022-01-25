import * as React from 'react';

/** Component properties for LabeledInput */
interface LabeledInputProps {
  type?: React.HTMLInputTypeAttribute;
  label: string;
  value?: any;
  setter: (value: string) => void;
  subLabel?: string;
  inputOptions?: Partial<React.HTMLAttributes<HTMLInputElement>>;
  labelWidth?: number;
  inputWidth?: number;
  rowClass?: string;
}

export const LabeledInput: React.FC<LabeledInputProps> = ({
  type,
  label,
  value,
  setter,
  subLabel,
  inputOptions,
  labelWidth,
  inputWidth,
  rowClass,
}) => (
  <div className={`form-group row${rowClass ? '' : ` ${rowClass}`}`}>
    <label className={`col-md-${labelWidth ?? 3} col-form-label text-right`}>{label}</label>
    <div className={`col-md-${inputWidth ?? 8}`}>
      <input
        type={type ?? 'text'}
        className="form-control"
        value={value !== undefined ? `${value}` : ''}
        onChange={(e) => setter(e.target.value)}
        {...inputOptions}
      />
      {subLabel && <small>{subLabel}</small>}
    </div>
  </div>
);
