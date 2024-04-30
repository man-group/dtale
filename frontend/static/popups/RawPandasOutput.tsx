import * as React from 'react';

import { BouncerWrapper } from '../BouncerWrapper';
import ButtonToggle from '../ButtonToggle';
import { useAppSelector } from '../redux/hooks';
import { selectDataId } from '../redux/selectors';
import { RemovableError } from '../RemovableError';
import { FuncType, load as loadFromAPI } from '../repository/RawPandasOutputRepository';

const FUNC_LABELS: Record<FuncType, string> = {
  [FuncType.INFO]: 'df.info()',
  [FuncType.N_UNIQUE]: 'df.nunique()',
  [FuncType.DESCRIBE]: 'df.describe().T',
};

export const RawPandasOutput: React.FC = () => {
  const dataId = useAppSelector(selectDataId);
  const [funcType, setFuncType] = React.useState<FuncType>(FuncType.INFO);
  const [error, setError] = React.useState<JSX.Element>();
  const [output, setOutput] = React.useState<string>();
  const [loadingOutput, setLoadingOutput] = React.useState(false);

  const loadOutput = async (): Promise<void> => {
    setError(undefined);
    setLoadingOutput(true);
    const response = await loadFromAPI(dataId, funcType);
    setLoadingOutput(false);
    if (response?.error) {
      setError(<RemovableError {...response} />);
      return;
    }
    setOutput(response?.output);
  };

  React.useEffect(() => {
    loadOutput();
  }, []);

  React.useEffect(() => {
    loadOutput();
  }, [funcType]);

  return (
    <div key="body" className="modal-body">
      <div className="form-group row mb-4">
        <label className="col-auto col-form-label text-right p-0">Function</label>
        <div className="col-md-8 pl-0">
          <ButtonToggle
            options={Object.values(FuncType).map((value) => ({ value, label: FUNC_LABELS[value] }))}
            update={(value) => setFuncType(value)}
            defaultValue={funcType}
            disabled={loadingOutput}
          />
        </div>
      </div>
      <BouncerWrapper showBouncer={loadingOutput}>
        {!!output && (
          <pre className="mb-0" style={{ height: 'calc(100vh - 90px)' }}>
            {output}
          </pre>
        )}
        {error}
      </BouncerWrapper>
    </div>
  );
};
