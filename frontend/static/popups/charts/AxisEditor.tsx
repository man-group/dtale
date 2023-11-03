import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { AxisSpec, DataSpec } from '../../chartUtils';
import { openMenu } from '../../menuUtils';
import { BaseOption } from '../../redux/state/AppState';
import { truncate } from '../../stringUtils';

const buildState = (y: Array<BaseOption<string>>, data: DataSpec): Record<string, string> => {
  return y.reduce(
    (res, { value }) => ({ ...res, [`${value}-min`]: `${data.min[value]}`, [`${value}-max`]: `${data.max[value]}` }),
    {},
  );
};

require('./AxisEditor.css');

/** Component properties for AxisEditor */
export interface AxisEditorProps {
  data: DataSpec;
  y: Array<BaseOption<string>>;
  updateAxis: (settings: AxisSpec) => void;
}

const AxisEditor: React.FC<AxisEditorProps & WithTranslation> = ({ data, y, updateAxis, t }) => {
  const [open, setOpen] = React.useState<boolean>(false);
  const [state, setState] = React.useState<Record<string, string | undefined>>(buildState(y, data));
  const menuRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    setState(buildState(y, data));
  }, [y, data]);

  const closeMenu = (): void => {
    const settings: AxisSpec = { min: {}, max: {} };
    let errors = false;

    y.forEach(({ value }) => {
      const currMin = state[`${value}-min`];
      if (currMin !== undefined && !isNaN(parseFloat(currMin))) {
        settings.min = { ...settings.min, [value]: parseFloat(currMin) };
      } else if (currMin !== undefined) {
        errors = true;
      }
      const currMax = state[`${value}-max`];
      if (currMax !== undefined && !isNaN(parseFloat(currMax))) {
        settings.max = { ...settings.max, [value]: parseFloat(currMax) };
      } else if (currMax !== undefined) {
        errors = true;
      }
    });
    y.forEach(({ value }) => {
      if (settings.min[value] > settings.max[value]) {
        errors = true;
      }
    });
    if (!errors) {
      setOpen(false);
      updateAxis(settings);
    }
  };

  if (!Object.keys(data).length) {
    return null;
  }
  const { min, max } = data;
  const axisMarkup = y.map(({ value }, idx) => {
    const minProp = `${value}-min`;
    const maxProp = `${value}-max`;
    return (
      <li key={idx}>
        <span className="mb-auto mt-auto font-weight-bold">{value}</span>
        <span className="mb-auto mt-auto">{t('Min')}:</span>
        <span>
          <input
            className="axis-input form-control input-sm"
            type="text"
            value={state[minProp] ?? ''}
            onChange={(e) => setState({ ...state, [minProp]: e.target.value })}
            data-testid={minProp}
          />
        </span>
        <span className="mb-auto mt-auto">{t('Max')}:</span>
        <span>
          <input
            className="axis-input form-control input-sm"
            type="text"
            value={state[maxProp] ?? ''}
            onChange={(e) => setState({ ...state, [maxProp]: e.target.value })}
            data-testid={maxProp}
          />
        </span>
      </li>
    );
  });
  const menuHandler = openMenu(() => setOpen(true), closeMenu, menuRef);
  const axisStr = y.map(({ value }) => `${value} (${min[value]},${max[value]})`).join(', ');
  return (
    <div className="toolbar__axis">
      <div className="input-group">
        <span className="input-group-addon">{t('Axis Ranges')}</span>
        <div className="input-group column-toggle">
          <span ref={menuRef} className="form-control custom-select axis-select" onClick={menuHandler}>
            {truncate(axisStr)}
          </span>
          <div className="axis-toggle__dropdown" hidden={!open}>
            <ul>{axisMarkup}</ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withTranslation('charts')(AxisEditor);
