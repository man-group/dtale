import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { useDebounce } from '../../customHooks';
import { BaseOption } from '../../redux/state/AppState';

import { BinsTester } from './BinsTester';
import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import {
  BaseCreateComponentProps,
  BinsConfig,
  BinsOperation,
  CreateColumnType,
  CreateColumnUpdateState,
} from './CreateColumnState';
import { LabeledInput } from './LabeledInput';

export const validateBinsCfg = (t: TFunction, cfg: BinsConfig): string | undefined => {
  const { col, bins, labels } = cfg;
  if (!col) {
    return t('Missing a column selection!') ?? undefined;
  }
  if (!bins || !parseInt(bins, 10)) {
    return t('Missing a bins selection!') ?? undefined;
  }
  const labelCt = (labels ?? '').split(',').length;
  if (labels && labelCt !== parseInt(bins, 10)) {
    return `${t('There are')} ${bins} ${t('bins, but you have only specified')} ${labelCt} labels!`;
  }
  return undefined;
};

export const buildCode = (state: CreateBinsState): CreateColumnCodeSnippet => {
  const col = state.col?.value;
  if (!col) {
    return undefined;
  }
  let code = `pd.${state.operation}(df['${col}'], `;
  if (!state.bins || !parseInt(state.bins, 10)) {
    return undefined;
  }
  code += `${state.operation === BinsOperation.CUT ? 'bins' : 'q'}=${state.bins}`;
  if (state.labels) {
    if (state.labels.split(',').length !== parseInt(state.bins, 10)) {
      return undefined;
    }
    code += `, labels=['${state.labels.split(',').join("', '")}']`;
  }
  code += ')';
  return code;
};

const buildCfg = (state: CreateBinsState): BinsConfig => ({
  operation: state.operation,
  bins: state.bins,
  labels: state.labels,
  col: state.col?.value,
});

/** State properties for CreateBins */
interface CreateBinsState {
  col?: BaseOption<string>;
  operation: BinsOperation;
  bins: string;
  labels: string;
}

/** Component properties for CreateBins */
interface CreateBinsProps extends BaseCreateComponentProps {
  namePopulated: boolean;
}

const CreateBins: React.FC<CreateBinsProps & WithTranslation> = ({ namePopulated, columns, updateState, t }) => {
  const [state, setState] = React.useState<CreateBinsState>({
    operation: BinsOperation.CUT,
    bins: '',
    labels: '',
  });
  const [labels, setLabels] = React.useState(state.labels);
  const debouncedLabels = useDebounce(labels, labels !== '' ? 1000 : 0);

  React.useEffect(() => setState({ ...state, labels: debouncedLabels.trim() ?? '' }), [debouncedLabels]);

  React.useEffect(() => {
    const cfg: BinsConfig = buildCfg(state);
    const code = buildCode(state);
    const updatedState: CreateColumnUpdateState = { cfg: { type: CreateColumnType.BINS, cfg }, code };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_bins`;
    }
    updateState(updatedState);
  }, [state]);

  const cfg = buildCfg(state);
  return (
    <div className="row" data-testid="bins-inputs">
      <div className="col-md-8 pr-0">
        <ColumnSelect
          label={t('Column')}
          prop="col"
          parent={state}
          updateState={(updatedState) => setState({ ...state, ...updatedState })}
          columns={columns}
          dtypes={['int', 'float']}
        />
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t('Operation')}</label>
          <div className="col-md-8">
            <ButtonToggle
              options={[
                { value: BinsOperation.CUT, label: t('Cut (Evenly Spaced)') },
                { value: BinsOperation.QCUT, label: t('Qcut (Evenly Sized)') },
              ]}
              update={(value: BinsOperation) => setState({ ...state, operation: value })}
              defaultValue={state.operation}
              compact={false}
            />
          </div>
        </div>
        <LabeledInput
          type="number"
          label={t('Bins') ?? ''}
          value={state.bins}
          setter={(value) => setState({ ...state, bins: value })}
        />
        <LabeledInput label={t('Labels') ?? ''} value={labels} setter={setLabels} />
      </div>
      <div className="col-md-4 pl-0">
        <BinsTester valid={validateBinsCfg(t, cfg) === undefined} cfg={cfg} />
      </div>
    </div>
  );
};

export default withTranslation('builders')(CreateBins);
