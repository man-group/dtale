import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { MultiValue, SingleValue } from 'react-select';

import { ColumnFilter, ColumnFilterOperand } from '../dtale/DataViewerState';
import { ColumnType } from '../dtale/gridUtils';
import { AppState } from '../redux/state/AppState';

import AsyncValueSelect from './AsyncValueSelect';
import { BaseColumnFilterProps, UniquesProps } from './ColumnFilterState';
import ValueSelect from './ValueSelect';

/** Properties of a numeric operand option */
interface NumericOperandOption {
  value: ColumnFilterOperand;
  label?: string;
  hint: string;
}

export const EQ_OPTION: NumericOperandOption = { value: '=', hint: 'Equals' };
export const NE_OPTION: NumericOperandOption = { value: 'ne', label: '\u2260', hint: 'Not Equals' };
const OPERANDS: NumericOperandOption[] = [
  EQ_OPTION,
  NE_OPTION,
  { value: '<', hint: 'Less Than' },
  { value: '>', hint: 'Greater Than' },
  { value: '<=', hint: 'Less Than or Equal' },
  { value: '>=', hint: 'Greater Than or Equal' },
  { value: '[]', hint: 'Range (Inclusive)' },
  { value: '()', hint: 'Range (Exclusive)' },
];

/** Component properties for StringFilter */
interface NumericFilterProps extends BaseColumnFilterProps, UniquesProps {
  colType: ColumnType;
  min: number;
  max: number;
}

export const NumericFilter: React.FC<NumericFilterProps & WithTranslation> = ({
  selectedCol,
  columnFilter,
  updateState,
  uniques,
  missing,
  uniqueCt,
  colType,
  min,
  max,
  t,
}) => {
  const dataId = useSelector((state: AppState) => state.dataId);
  const [operand, setOperand] = React.useState<ColumnFilterOperand>(columnFilter?.operand ?? '=');
  const [selected, setSelected] = React.useState<string[]>(
    ['=', 'ne'].includes(operand) ? (columnFilter?.value as string[]) : [],
  );
  const [minimum, setMinimum] = React.useState<string>(`${columnFilter?.min ?? min ?? ''}`);
  const [maximum, setMaximum] = React.useState<string>(`${columnFilter?.max ?? max ?? ''}`);
  const [value, setValue] = React.useState<string>(`${columnFilter?.value ?? ''}`);
  const [triggerSave, setTriggerSave] = React.useState<boolean>(false);

  const parseFunc: (val: string) => number =
    colType === ColumnType.INT ? (val: string) => parseInt(val, 10) : parseFloat;

  const updateCfgForVal = (cfg: ColumnFilter): ColumnFilter => {
    const numVal = parseFunc(value);
    if (isNaN(numVal)) {
      return { type: colType };
    }
    return { ...cfg, value: numVal };
  };

  const save = async (): Promise<void> => {
    let cfg: ColumnFilter = { type: colType, operand };
    switch (operand) {
      case '=':
      case 'ne': {
        if (colType === ColumnType.INT) {
          cfg = { ...cfg, value: selected ?? [], operand };
        } else {
          cfg = updateCfgForVal(cfg);
        }
        break;
      }
      case '<':
      case '>':
      case '<=':
      case '>=':
        cfg = updateCfgForVal(cfg);
        break;
      case '[]':
      case '()': {
        const parsedMinimum = parseFunc(minimum);
        const parsedMaximum = parseFunc(maximum);
        if (!isNaN(parsedMinimum)) {
          cfg.min = parsedMinimum;
        }
        if (!isNaN(parsedMaximum)) {
          cfg.max = parsedMaximum;
        }
        if (cfg.min === undefined && cfg.max === undefined) {
          cfg = { type: colType };
          break;
        }
        if (min === cfg.min && max === cfg.max) {
          cfg = { type: colType };
          break;
        }
        break;
      }
      default:
        break;
    }
    await updateState(cfg);
  };

  React.useEffect(() => {
    if (triggerSave) {
      save();
      setTriggerSave(false);
    }
  }, [triggerSave]);

  const createValueInput = (setter: (inputVal: string) => void, label: string, inputValue?: string): JSX.Element => (
    <div className="row pt-3">
      <div className="col-auto m-auto">
        <input
          type="text"
          placeholder={`Enter ${label}...`}
          className="form-control numeric-filter"
          value={inputValue ?? ''}
          disabled={missing}
          onChange={async (e) => {
            setter(e.target.value);
            setTriggerSave(true);
          }}
        />
      </div>
    </div>
  );

  const renderOperandInputs = (): React.ReactNode => {
    switch (operand) {
      case '<':
      case '>':
      case '<=':
      case '>=':
        return createValueInput(setValue, 'Value', value);
      case '[]':
      case '()':
        return (
          <React.Fragment>
            {createValueInput(setMinimum, 'Minimum', minimum)}
            {createValueInput(setMaximum, 'Maximum', maximum)}
          </React.Fragment>
        );
      case '=':
      case 'ne':
      default:
        {
          if (colType === ColumnType.FLOAT) {
            return createValueInput(setValue, 'Value', value);
          }
          const requiresAsync = uniqueCt > 500;
          const props = { dataId, selectedCol, updateState, uniques, missing, uniqueCt };
          return (
            <div key={2} className="row pt-3">
              <div className="col-md-12">
                {!requiresAsync && (
                  <ValueSelect
                    {...props}
                    selected={selected}
                    updateState={async (option?: MultiValue<string> | SingleValue<string>) => {
                      setSelected(option ? (option as string[]) : []);
                      setTriggerSave(true);
                    }}
                  />
                )}
                {requiresAsync && (
                  <AsyncValueSelect
                    {...props}
                    selected={selected}
                    updateState={async (option?: MultiValue<string> | SingleValue<string>) => {
                      setSelected(option ? (option as string[]) : []);
                      setTriggerSave(true);
                    }}
                  />
                )}
              </div>
            </div>
          );
        }
        return null;
    }
  };

  return (
    <React.Fragment>
      <div className="row numeric-filter-inputs">
        <div className="col-md-12">
          <div className="btn-group compact m-auto font-weight-bold column-sorting" style={{ fontSize: '16px' }}>
            {OPERANDS.map((option, i) => {
              const active = operand === option.value;
              return (
                <button
                  key={i}
                  style={active ? {} : { color: '#565b68' }}
                  className={`btn btn-primary ${active ? 'active' : ''} font-weight-bold`}
                  onClick={async () => {
                    setOperand(option.value);
                    setTriggerSave(true);
                  }}
                  title={t(option.hint) ?? undefined}
                  disabled={active || missing}
                >
                  {option.label ?? option.value}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {renderOperandInputs()}
    </React.Fragment>
  );
};

export default withTranslation('column_filter')(NumericFilter);
