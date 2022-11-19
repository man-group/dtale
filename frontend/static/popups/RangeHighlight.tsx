import * as React from 'react';
import { RGBColor, SketchPicker } from 'react-color';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import reactCSS from 'reactcss';
import { AnyAction } from 'redux';

import * as serverState from '../dtale/serverStateManagement';
import * as settingsActions from '../redux/actions/settings';
import {
  AppState,
  BaseOption,
  HasActivation,
  InstanceSettings,
  RangeHighlightConfig,
  RangeHighlightModeCfg,
  RangeHighlightModes,
  RangeHighlightPopupData,
} from '../redux/state/AppState';

import { buildAllOption, default as ColumnSelect } from './create/ColumnSelect';

export const BASE_COLOR: RGBColor = { r: 255, g: 245, b: 157, a: 1 };
const BASE_RANGE: RangeHighlightModes = {
  equals: { active: false, color: { ...BASE_COLOR } },
  greaterThan: { active: false, color: { ...BASE_COLOR } },
  lessThan: { active: false, color: { ...BASE_COLOR } },
};

/** Type-defintion for range data filter */
type RangeFilter = (val: number, equals: number) => boolean;

export const MODES: Array<[string, keyof RangeHighlightModes, RangeFilter]> = [
  ['Equals', 'equals', (val: number, equals: number): boolean => val === equals],
  ['Greater Than', 'greaterThan', (val: number, greaterThan: number): boolean => val > greaterThan],
  ['Less Than', 'lessThan', (val: number, lessThan: number): boolean => val < lessThan],
];

/**
 * Retrieve range highlight modes for a specific column.
 *
 * @param col the column to retrieve.
 * @param ranges the pre-existing range highlights.
 * @return pre-existing range highlight modes if existing, default otherwise.
 */
function retrieveRange(col: BaseOption<string>, ranges: RangeHighlightConfig): RangeHighlightModes {
  const range = ranges[col.value];
  if (range) {
    MODES.forEach(([_label, key, _filter]) => {
      if (range[key].value === undefined || range[key].value === null) {
        range[key].value = range[key].value;
      }
    });
    return range;
  }
  return { ...BASE_RANGE };
}

/** Style class definitions */
interface Styles {
  color: React.CSSProperties;
  swatch: React.CSSProperties;
  popover: React.CSSProperties;
  cover: React.CSSProperties;
}

const styles = (color: RGBColor): Styles =>
  reactCSS<Styles>({
    default: {
      color: {
        width: '30px',
        height: '14px',
        borderRadius: '2px',
        background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
      },
      swatch: {
        padding: '5px',
        background: '#fff',
        borderRadius: '1px',
        boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
        display: 'inline-block',
        cursor: 'pointer',
      },
      popover: {
        position: 'absolute',
        zIndex: 2,
      },
      cover: {
        position: 'fixed',
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
      },
    },
  });

export const rgbaStr = (color: RGBColor): string => `rgba(${color.r},${color.g},${color.b},${color.a})`;

/**
 * Convert range highlight modes to JSX
 *
 * @param range range highlight modes
 * @return JSX elements
 */
function rangeAsStr(range: RangeHighlightModes): JSX.Element[] {
  const subRanges: JSX.Element[] = [];
  MODES.forEach(([label, key, _filter]) => {
    const { active, value, color } = range[key];
    if (active) {
      subRanges.push(<span key={subRanges.length}>{label} </span>);
      subRanges.push(
        <span key={subRanges.length} style={{ background: rgbaStr(color), padding: 3 }}>
          {value}
        </span>,
      );
      subRanges.push(<span key={subRanges.length}> or </span>);
    }
  });
  subRanges.pop();
  return subRanges;
}

const RangeHighlight: React.FC<WithTranslation> = ({ t }) => {
  const { chartData, dataId } = useSelector((state: AppState) => ({
    chartData: state.chartData as RangeHighlightPopupData,
    dataId: state.dataId,
  }));
  const dispatch = useDispatch();
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): AnyAction =>
    dispatch(settingsActions.updateSettings(updatedSettings) as any as AnyAction);

  const allOption = React.useMemo(() => buildAllOption(t), [t]);
  const [ranges, setRanges] = React.useState<RangeHighlightConfig>(
    JSON.parse(JSON.stringify(chartData.rangeHighlight ?? {})),
  );
  const [col, setCol] = React.useState<BaseOption<string>>(allOption);
  const [editColor, setEditColor] = React.useState<keyof RangeHighlightModes>();
  const [currRange, setCurrRange] = React.useState<RangeHighlightModes>(retrieveRange(col, ranges));

  React.useEffect(() => {
    const copiedConfig = JSON.parse(JSON.stringify(chartData.rangeHighlight ?? {}));
    setRanges(copiedConfig);
    setCurrRange(retrieveRange(col, copiedConfig));
  }, [chartData.rangeHighlight]);

  const updateHighlights = (key: keyof RangeHighlightModes, rangeState: Partial<RangeHighlightModeCfg>): void => {
    setCurrRange({ ...currRange, [key]: { ...currRange[key], ...rangeState } });
  };

  const applyRange = async (): Promise<void> => {
    const updatedRange: RangeHighlightModes & HasActivation = { ...currRange, active: true };
    let backgroundMode;
    MODES.forEach(([_label, key, _filter]) => {
      const { active, value } = currRange[key];
      if (active && value !== undefined && !isNaN(value)) {
        updatedRange[key].value = value;
        backgroundMode = 'range';
      }
    });
    const updatedRanges = { ...ranges, [col.value]: updatedRange };
    if (chartData.backgroundMode === 'range') {
      backgroundMode = undefined;
    }
    setRanges(updatedRanges);
    await serverState.saveRangeHighlights(dataId, updatedRanges);
    updateSettings({ backgroundMode, rangeHighlight: updatedRanges });
  };

  const removeRange = async (colName: string): Promise<void> => {
    const updatedRanges = { ...ranges };
    delete updatedRanges[colName];
    setRanges(updatedRanges);
    await serverState.saveRangeHighlights(dataId, ranges);
    const backgroundMode = Object.keys(updatedRanges).length ? 'range' : undefined;
    updateSettings({ backgroundMode, rangeHighlight: updatedRanges });
  };

  const toggleRange = async (colName: string): Promise<void> => {
    const updatedRanges = { ...ranges };
    updatedRanges[colName].active = !updatedRanges[colName].active;
    setRanges(updatedRanges);
    await serverState.saveRangeHighlights(dataId, updatedRanges);
    updateSettings({ backgroundMode: 'range', rangeHighlight: updatedRanges });
  };

  return (
    <div key="body" className="modal-body">
      <ColumnSelect
        label="Col"
        prop="col"
        parent={{ col }}
        updateState={(state): void => {
          setCol(state.col as BaseOption<string>);
          setCurrRange(retrieveRange(state.col as BaseOption<string>, ranges));
        }}
        columns={chartData?.columns ?? []}
        dtypes={['int', 'float']}
        includeAllOption={true}
      />
      {MODES.map(([label, key, _filter], i) => {
        const { active, value, color } = currRange[key];
        const modeStyles = styles(color ?? BASE_COLOR);
        return (
          <div key={i} className="form-group row">
            <label className="col-md-4 col-form-label text-right">
              <i
                className={`ico-check-box${active ? '' : '-outline-blank'} pointer mr-3 float-left`}
                onClick={() => updateHighlights(key, { active: !active })}
              />
              {t(label, { ns: 'column_filter' })}
            </label>
            <div className="col-md-6">
              <input
                type="number"
                disabled={!active}
                className="form-control"
                value={`${value ?? ''}`}
                onChange={(e) =>
                  updateHighlights(key, { value: e.target.value ? parseFloat(e.target.value) : undefined })
                }
              />
            </div>
            <div className="col-md-1">
              <div style={modeStyles.swatch} onClick={() => setEditColor(editColor === key ? undefined : key)}>
                <div style={modeStyles.color} />
              </div>
              {editColor === key ? (
                <div style={modeStyles.popover}>
                  <div style={modeStyles.cover} onClick={() => setEditColor(undefined)} />
                  <SketchPicker color={color} onChange={({ rgb }) => updateHighlights(key, { color: rgb })} />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
      <div className="form-group row">
        <div className="col-md-4" />
        <div className="col-md-7">
          <button className="btn btn-primary float-right" onClick={applyRange}>
            {t('range_highlight:Apply')}
          </button>
        </div>
      </div>
      {Object.keys(ranges).map((colName: string) => (
        <div key={`range-${colName}`} className="form-group row">
          <div className="col-md-1">
            <i
              className={`ico-check-box${ranges[colName].active ? '' : '-outline-blank'} pointer`}
              onClick={() => toggleRange(colName)}
            />
          </div>
          <div className="col-md-9">
            <b>{colName === 'all' ? allOption.label : colName}</b>
            {`: `}
            {rangeAsStr(ranges[colName])}
          </div>
          <div className="col-md-2 p-0">
            <i className="ico-remove-circle pointer mt-auto mb-auto" onClick={() => removeRange(colName)} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default withTranslation(['column_filter', 'range_highlight'])(RangeHighlight);
