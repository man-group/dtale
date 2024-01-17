import * as React from 'react';

import { useAppSelector } from '../redux/hooks';
import { selectDataId } from '../redux/selectors';
import { RemovableError } from '../RemovableError';
import * as CodeExportRepository from '../repository/CodeExportRepository';

import CodePopup from './CodePopup';

export const CodeExport: React.FC = () => {
  const dataId = useAppSelector(selectDataId);
  const [error, setError] = React.useState<JSX.Element>();
  const [code, setCode] = React.useState<string>();

  React.useEffect(() => {
    (async () => {
      const response = await CodeExportRepository.load(dataId);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      setCode(response?.code);
    })();
  }, []);

  if (error) {
    return (
      <div key="body" className="modal-body">
        {error}
      </div>
    );
  }
  return <CodePopup code={code} />;
};
