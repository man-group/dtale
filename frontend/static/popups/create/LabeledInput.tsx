import * as React from 'react';

/** Component properties for DtaleInput */
interface DtaleInputProps {
  type?: React.HTMLInputTypeAttribute;
  value?: any;
  setter: (value: string) => void;
  inputOptions?: Partial<React.HTMLAttributes<HTMLInputElement>>;
}

const DtaleInput: React.FC<DtaleInputProps> = ({ type = 'text', value, setter, inputOptions }) => (
  <input
    type={type}
    className="form-control"
    value={value !== undefined ? `${value}` : ''}
    onChange={(e) => setter(e.target.value)}
    {...inputOptions}
  />
);

/** Component properties for LabeledInput */
interface LabeledInputProps extends DtaleInputProps {
  label: string | null | JSX.Element;
  subLabel?: string | null;
  labelWidth?: number;
  inputWidth?: number;
  rowClass?: string;
  tooltip?: string | null;
}

export const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  subLabel,
  labelWidth = 3,
  inputWidth = 8,
  rowClass,
  tooltip,
  ...inputProps
}) => (
  <div className={`form-group row${rowClass ? '' : ` ${rowClass}`}`}>
    <label className={`col-md-${labelWidth} col-form-label text-right`}>{label}</label>
    <div className={`col-md-${inputWidth}`}>
      {tooltip && (
        <div className="hoverable">
          <DtaleInput {...inputProps} />
          <div className="hoverable__content edit-cell">{tooltip}</div>
        </div>
      )}
      {!tooltip && <DtaleInput {...inputProps} />}
      {subLabel && <small>{subLabel}</small>}
    </div>
  </div>
);
