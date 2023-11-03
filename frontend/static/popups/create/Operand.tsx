import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { createFilter, default as Select } from 'react-select';

import ButtonToggle from '../../ButtonToggle';
import { ColumnDef } from '../../dtale/DataViewerState';
import { BaseOption } from '../../redux/state/AppState';
import { capitalize } from '../../stringUtils';

import { constructColumnOptionsFilteredByDtypeAndOtherValues } from './ColumnSelect';
import { OperandDataType } from './CreateColumnState';

/** State properties for operand configuration */
export interface OperandState {
  type: OperandDataType;
  col?: BaseOption<string>;
  val?: string;
}

/** Component properties for Operand */
interface OperandProps {
  name: string;
  cfg: OperandState;
  otherOperand?: OperandState;
  dataType: 'text' | 'number';
  colTypes?: string[];
  updateState: (updates: { [key: string]: OperandState }) => void;
  columns: ColumnDef[];
}

const Operand: React.FC<OperandProps & WithTranslation> = ({
  name,
  cfg,
  otherOperand,
  dataType,
  colTypes,
  columns,
  t,
  ...props
}) => {
  const updateState = (newCfg: Partial<OperandState>): void => {
    props.updateState({ [name]: { ...cfg, ...newCfg } });
  };

  const inputMarkup = React.useMemo(() => {
    if (cfg.type === 'col') {
      const otherValues = otherOperand?.type === 'col' ? [otherOperand?.col] : undefined;
      const finalOptions = constructColumnOptionsFilteredByDtypeAndOtherValues(columns, colTypes, otherValues);
      return (
        <div className="input-group">
          <Select
            className="Select is-clearable is-searchable Select--single"
            classNamePrefix="Select"
            options={finalOptions}
            getOptionLabel={(o) => o.label ?? o.value}
            getOptionValue={(o) => o.value}
            value={cfg.col}
            onChange={(selected) => updateState({ col: selected ?? undefined })}
            noOptionsMessage={() => t('No columns found')}
            isClearable={true}
            filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
          />
        </div>
      );
    } else {
      return (
        <div className="input-group">
          <input
            type={dataType}
            className="form-control numeric-input"
            value={cfg.val ?? ''}
            onChange={(e) => updateState({ val: e.target.value })}
          />
        </div>
      );
    }
  }, [cfg.type, columns]);

  return (
    <div className="form-group row" data-testid={`${name}-inputs`}>
      <div className="col-md-3 text-right">
        <ButtonToggle
          options={Object.values(OperandDataType).map((value) => ({ value, label: capitalize(value) }))}
          update={(value?: OperandDataType) => updateState({ type: value })}
          defaultValue={cfg.type}
          compact={false}
        />
      </div>
      <div className="col-md-8">{inputMarkup}</div>
    </div>
  );
};

export default withTranslation('builders')(Operand);
