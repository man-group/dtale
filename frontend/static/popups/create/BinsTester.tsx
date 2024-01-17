import * as React from 'react';

import { BouncerWrapper } from '../../BouncerWrapper';
import { useAppSelector } from '../../redux/hooks';
import { selectDataId } from '../../redux/selectors';
import * as CreateColumnRepository from '../../repository/CreateColumnRepository';
import { ColumnAnalysisChart } from '../analysis/ColumnAnalysisChart';
import { AnalysisType } from '../analysis/ColumnAnalysisState';

import { BinsConfig } from './CreateColumnState';

/** Component properties for BinsTester */
interface BinsTesterProps {
  cfg: BinsConfig;
  valid?: boolean;
}

export const BinsTester: React.FC<BinsTesterProps> = ({ cfg, valid }) => {
  const dataId = useAppSelector(selectDataId);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [data, setData] = React.useState<CreateColumnRepository.TestBinsResponse>();
  const loadedCfg = React.useRef<string>();

  React.useEffect(() => {
    if (valid) {
      if (JSON.stringify(cfg) !== loadedCfg.current) {
        loadedCfg.current = JSON.stringify(cfg);
        setLoading(true);
        CreateColumnRepository.testBins(dataId, cfg).then((response) => {
          setLoading(false);
          if (response?.error) {
            setData(undefined);
          } else if (response) {
            setData(response);
          }
        });
      }
    } else {
      setData(undefined);
    }
  }, [valid, cfg]);

  return (
    <BouncerWrapper showBouncer={loading}>
      {data && (
        <ColumnAnalysisChart fetchedChartData={data} height={185} finalParams={{ type: AnalysisType.HISTOGRAM }} />
      )}
    </BouncerWrapper>
  );
};
