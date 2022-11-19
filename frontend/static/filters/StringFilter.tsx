import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { createFilter, default as Select } from 'react-select';

import { ColumnFilter, ColumnFilterOperand } from '../dtale/DataViewerState';
import { AppState } from '../redux/state/AppState';

import AsyncValueSelect from './AsyncValueSelect';
import { BaseColumnFilterProps, UniquesProps } from './ColumnFilterState';
import { EQ_OPTION, NE_OPTION } from './NumericFilter';
import ValueSelect from './ValueSelect';

/** StringFilter action types */
enum StringFilterAction {
  EQUALS = 'equals',
  STARTSWITH = 'startswith',
  ENDSWITH = 'endswith',
  CONTAINS = 'contains',
  REGEX = 'regex',
  LENGTH = 'length',
}

/** Component properties for StringFilter */
export type StringFilterProps = BaseColumnFilterProps & UniquesProps;

export const StringFilter: React.FC<StringFilterProps & WithTranslation> = ({
  selectedCol,
  columnFilter,
  updateState,
  uniques,
  missing,
  uniqueCt,
  t,
}) => {
  const dataId = useSelector((state: AppState) => state.dataId);
  const [selected, setSelected] = React.useState<string[]>(columnFilter?.value as string[]);
  const [operand, setOperand] = React.useState<ColumnFilterOperand>(columnFilter?.operand ?? '=');
  const [action, setAction] = React.useState<StringFilterAction>(
    (columnFilter?.action as StringFilterAction) ?? StringFilterAction.EQUALS,
  );
  const [raw, setRaw] = React.useState<string>(columnFilter?.raw as string);
  const [rawInput, setRawInput] = React.useState(columnFilter?.raw as string);
  const [caseSensitive, setCaseSensitive] = React.useState<boolean>(columnFilter?.caseSensitive ?? false);
  const [triggerSave, setTriggerSave] = React.useState<boolean>(false);

  const save = async (): Promise<void> => {
    const cfg: ColumnFilter = {
      type: 'string',
      value: selected || [],
      operand,
      action,
      raw,
      caseSensitive,
    };
    if (cfg.action === 'length' && ((cfg.raw as string) ?? '').split(',').find((v) => isNaN(parseInt(v, 10)))) {
      // simply update immediate state if there is an invalid integer string specified
      return;
    }
    await updateState(cfg);
  };

  React.useEffect(() => {
    if (triggerSave) {
      save();
      setTriggerSave(false);
    }
  }, [triggerSave]);

  const renderInputHint = (): string => {
    const base = t('Press ENTER to submit', { ns: 'correlations' });
    if (action === StringFilterAction.LENGTH) {
      return `${base}. Enter integers for length. For a range enter '1,3' which means '1 <= str.length <= 3'.`;
    } else if (action === StringFilterAction.REGEX) {
      return `${base}. Enter Python\'s regular expression understood by re.search().`;
    }
    return base;
  };

  const requiresAsync = uniqueCt > 500;
  const active = operand === 'ne';
  return (
    <>
      <div className="row pb-3">
        <div className="col-auto text-center pr-0 mt-auto mb-auto">
          <div className="btn-group compact m-auto font-weight-bold column-sorting" style={{ fontSize: '16px' }}>
            <button
              style={active ? {} : { color: '#565b68' }}
              className={`btn btn-primary ${active ? 'active' : ''} font-weight-bold`}
              onClick={async () => {
                setOperand(active ? EQ_OPTION.value : NE_OPTION.value);
                setTriggerSave(true);
              }}
              title={t(active ? NE_OPTION.hint : EQ_OPTION.hint) ?? ''}
              disabled={missing}
            >
              {NE_OPTION.label}
            </button>
          </div>
        </div>
        <div className="col-auto text-center pr-0 pl-3 mt-auto mb-auto">
          <div className="btn-group compact m-auto font-weight-bold column-sorting" style={{ fontSize: '16px' }}>
            <button
              style={active ? {} : { color: '#565b68' }}
              className={`btn btn-primary ${caseSensitive ? 'active' : ''} font-weight-bold`}
              onClick={async () => {
                setCaseSensitive(!caseSensitive);
                setTriggerSave(true);
              }}
              title={`${t('Case-Sensitive')} (${caseSensitive ? 'ON' : 'OFF'})`}
              disabled={missing}
            >
              {'Aa'}
            </button>
          </div>
        </div>
        <div className="col pl-3">
          <Select
            isClearable={false}
            className="Select is-clearable is-searchable Select--single"
            classNamePrefix="Select"
            options={Object.values(StringFilterAction).map((value) => ({
              label: value.valueOf(),
              value: value as StringFilterAction,
            }))}
            value={action ? { label: action.valueOf(), value: action } : null}
            onChange={async (option) => {
              setAction(option!.value);
              setTriggerSave(true);
            }}
            filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
          />
        </div>
      </div>
      <div className="row">
        <div className="col-md-12 string-filter-inputs">
          {action === StringFilterAction.EQUALS && !requiresAsync && (
            <ValueSelect<string>
              {...{ selected, uniques: uniques, missing }}
              updateState={async (option?: string[] | string) => {
                setSelected(option ? (option as string[]) : []);
                setTriggerSave(true);
              }}
            />
          )}
          {action === StringFilterAction.EQUALS && requiresAsync && (
            <AsyncValueSelect<string>
              {...{ dataId, selected, selectedCol, uniques, missing }}
              updateState={async (option?: string[] | string) => {
                setSelected(option ? (option as string[]) : []);
                setTriggerSave(true);
              }}
            />
          )}
          {action !== StringFilterAction.EQUALS && (
            <div data-tip={renderInputHint()}>
              <input
                type="text"
                className="form-control"
                value={rawInput ?? ''}
                onChange={(e) => setRawInput(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    setRaw(rawInput);
                    setTriggerSave(true);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default withTranslation(['column_filter', 'correlations'])(StringFilter);
