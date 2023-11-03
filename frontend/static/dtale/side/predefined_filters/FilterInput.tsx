import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { MultiValue, SingleValue } from 'react-select';

import ButtonToggle from '../../../ButtonToggle';
import { ColumnDef } from '../../../dtale/DataViewerState';
import AsyncValueSelect from '../../../filters/AsyncValueSelect';
import ValueSelect from '../../../filters/ValueSelect';
import { Stat } from '../../../popups/describe/Stat';
import { PredefinedFilter, PredefinedFilterValue, PredfinedFilterInputType } from '../../../redux/state/AppState';
import * as ColumnFilterRepository from '../../../repository/ColumnFilterRepository';
import * as gu from '../../gridUtils';
import { predefinedFilterStr } from '../../info/infoUtils';

const buildCurrent = (filter: PredefinedFilter, value: PredefinedFilterValue): string | string[] | undefined => {
  const { inputType } = filter;
  switch (inputType) {
    case PredfinedFilterInputType.SELECT:
      return value.value as string;
    case PredfinedFilterInputType.MULTISELECT:
      return value.value as string[];
    case PredfinedFilterInputType.INPUT:
    default:
      return `${value.value ?? ''}`;
  }
};

const buildFinal = (
  currentValue: string | string[] | undefined,
  inputType: PredfinedFilterInputType,
): string | string[] | undefined => {
  switch (inputType) {
    case PredfinedFilterInputType.SELECT:
      return currentValue ? (currentValue as string) : undefined;
    case PredfinedFilterInputType.MULTISELECT:
      return currentValue ? (currentValue as string[]) : undefined;
    case PredfinedFilterInputType.INPUT:
    default:
      return currentValue as string;
  }
};

/** Component properties for FilterInput */
export interface FilterInputProps {
  dataId: string;
  filter: PredefinedFilter;
  save: (name: string, value: any | any[] | undefined, active: boolean) => Promise<void>;
  columns: ColumnDef[];
  value: PredefinedFilterValue;
}

const FilterInput: React.FC<FilterInputProps & WithTranslation> = ({ dataId, filter, value, columns, t, ...props }) => {
  const [edit, setEdit] = React.useState(false);
  const [active, setActive] = React.useState(value?.active ?? true);
  const [toggleCt, setToggleCt] = React.useState(0);
  const [currentValue, setCurrentValue] = React.useState(buildCurrent(filter, value));
  const [data, setData] = React.useState<ColumnFilterRepository.ColumnFilterData>();
  const [errors, setErrors] = React.useState<string[]>();

  const [colCfg, requiresAsync] = React.useMemo(() => {
    const { column } = filter;
    const cfg = columns.find(({ name }) => name === column)!;
    return [cfg, (cfg?.unique_ct ?? 0) > 500];
  }, [columns, filter]);

  React.useEffect(() => {
    setCurrentValue(buildCurrent(filter, value));
  }, [value]);

  const toggleEdited = async (): Promise<void> => {
    if (!toggleCt && filter.inputType !== PredfinedFilterInputType.INPUT && !requiresAsync) {
      const response = await ColumnFilterRepository.loadFilterData(dataId, filter.column);
      if (response?.success) {
        setData(response);
        setToggleCt(toggleCt + 1);
        setEdit(!edit);
      }
    } else {
      setToggleCt(toggleCt + 1);
      setEdit(!edit);
    }
  };

  const save = async (): Promise<void> => {
    const { name, inputType } = filter;
    const colType = gu.findColType(colCfg?.dtype);
    const finalValue = buildFinal(currentValue, inputType);
    const newErrors: string[] = [];
    const finalValues: any[] = [];
    (Array.isArray(finalValue) ? finalValue : [finalValue]).forEach((val) => {
      if (val === undefined) {
        return;
      }
      if (colType === gu.ColumnType.INT && val) {
        const parsedVal = parseInt(val, 10);
        if (isNaN(parsedVal)) {
          newErrors.push(`Invalid integer, ${val}!`);
        } else {
          finalValues.push(parsedVal);
        }
      } else if (colType === gu.ColumnType.FLOAT && val) {
        const parsedVal = parseFloat(val);
        if (isNaN(parsedVal)) {
          newErrors.push(`Invalid float, ${val}!`);
        } else {
          finalValues.push(parsedVal);
        }
      } else {
        finalValues.push(val);
      }
    });
    if (newErrors.length) {
      setErrors(newErrors);
    } else {
      setErrors(undefined);
      setEdit(false);
      await props.save(name, inputType === PredfinedFilterInputType.MULTISELECT ? finalValues : finalValues[0], active);
    }
  };

  const renderEdited = (): React.ReactNode => {
    if (!edit) {
      return null;
    }
    const { inputType } = filter;
    switch (inputType) {
      case PredfinedFilterInputType.INPUT:
        return <input value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />;
      case PredfinedFilterInputType.SELECT:
      case PredfinedFilterInputType.MULTISELECT: {
        const multiSelect = inputType === PredfinedFilterInputType.MULTISELECT;
        if (requiresAsync) {
          return (
            <AsyncValueSelect<string>
              {...colCfg}
              selectedCol={colCfg.name}
              uniques={(data?.uniques ?? []) as string[]}
              isMulti={multiSelect}
              dataId={dataId}
              selected={currentValue}
              updateState={(selected?: MultiValue<string> | SingleValue<string>) =>
                setCurrentValue(selected ? (multiSelect ? (selected as string[]) : (selected as string)) : undefined)
              }
            />
          );
        } else {
          return (
            <ValueSelect<string>
              {...colCfg}
              uniques={(data?.uniques ?? []) as string[]}
              isMulti={multiSelect}
              selected={currentValue}
              updateState={(selected?: MultiValue<string> | SingleValue<string>) =>
                setCurrentValue(selected ? (multiSelect ? (selected as string[]) : (selected as string)) : undefined)
              }
            />
          );
        }
      }
      default:
        return `Unknown "input_type" specified: ${inputType}`;
    }
  };

  const { name, description, column } = filter;
  return (
    <div key={name} className="row ml-0 mr-0 mb-5 predefined-filter-input">
      <div className="col-md-12">
        <div className="row">
          <h2 className="font-weight-bold col">{name}</h2>
          {!edit && (
            <button className="btn btn-primary col-auto pt-2 pb-2 mb-auto mt-3 mr-3" onClick={toggleEdited}>
              {t('predefined:Edit')}
            </button>
          )}
          {edit && (
            <button className="btn btn-primary col-auto pt-2 pb-2 mb-auto mt-2 mr-2" onClick={toggleEdited}>
              {t('predefined:Cancel')}
            </button>
          )}
          {edit && (
            <button className="btn btn-primary col-auto pt-2 pb-2 mb-auto mt-2 mr-2" onClick={save}>
              {t('predefined:Save')}
            </button>
          )}
        </div>
      </div>
      <div className="col-md-6">
        <ul>
          <Stat t={t} field="predefined:Column" value={column} />
          <Stat t={t} field="predefined:Description" value={description} />
        </ul>
      </div>
      <div className="col-md-6">
        <div className="row">
          <div className="col-md-12">
            {!edit && (
              <>
                <span className="font-weight-bold pr-3">{t('Current Value', { ns: 'predefined' })}:</span>
                <span>{gu.predefinedHasValue(value) ? predefinedFilterStr([filter], name, value.value) : '--'}</span>
              </>
            )}
            {renderEdited()}
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <ButtonToggle
              options={[
                { label: 'Enabled', value: true },
                { label: 'Disabled', value: false },
              ]}
              update={async (update) => {
                setActive(update);
                await props.save(filter.name, value?.value, update);
              }}
              defaultValue={active}
              className="pl-0 pr-0 pt-3 float-right"
            />
          </div>
        </div>
        {errors && (
          <ul className="predefined-filter-errors">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default withTranslation(['menu', 'predefined', 'side'])(FilterInput);
