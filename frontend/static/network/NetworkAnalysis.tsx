import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { BouncerWrapper } from '../BouncerWrapper';
import Collapsible from '../Collapsible';
import { AppState } from '../redux/state/AppState';
import { RemovableError } from '../RemovableError';
import * as NetworkRespository from '../repository/NetworkRespository';

import { ValueHolder } from './NetworkState';

/** Component properties for NetworkAnalysis */
interface NetworkAnalysisProps {
  to?: ValueHolder<string>;
  from?: ValueHolder<string>;
  weight?: ValueHolder<string>;
}

/** Parameters for NetworkX analysis */
interface AnalysisParams extends Record<string, string> {
  to: string;
  from: string;
  weight: string;
}

/** NetworkX analysis with parameters used */
interface FullAnalysis extends NetworkRespository.Analysis {
  params: AnalysisParams;
}

/** Analysis label definition */
type AnalysisLabel = [keyof NetworkRespository.Analysis, string];

const LABELS: AnalysisLabel[] = [
  ['node_ct', 'Node Count'],
  ['triangle_ct', 'Triangle Count'],
  ['most_connected_node', 'Most Connected Node'],
  ['leaf_ct', 'Leaf Count'],
  ['edge_ct', 'Edge Count'],
  ['max_edge', 'Max Edge Weight'],
  ['min_edge', 'Min Edge Weight'],
  ['avg_weight', 'Average Edge Weight'],
];

const buildStat = (t: TFunction, label: string, value?: number | string): JSX.Element => (
  <React.Fragment>
    {value !== undefined && (
      <div>
        <h4 className="d-inline pr-5">{`${t(label)}:`}</h4>
        <span className="d-inline">{value === undefined ? 'N/A' : value}</span>
      </div>
    )}
  </React.Fragment>
);

const buildParams = (
  to?: ValueHolder<string>,
  from?: ValueHolder<string>,
  weight?: ValueHolder<string>,
): AnalysisParams => ({
  to: to?.value ?? '',
  from: from?.value ?? '',
  weight: weight?.value ?? '',
});

const NetworkAnalysis: React.FC<NetworkAnalysisProps & WithTranslation> = ({ to, from, weight, t }) => {
  const dataId = useSelector((state: AppState) => state.dataId);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [analysis, setAnalysis] = React.useState<FullAnalysis>();
  const [error, setError] = React.useState<JSX.Element>();

  const loadAnalysis = async (): Promise<void> => {
    const params = buildParams(to, from, weight);
    if (!analysis || analysis.params !== params) {
      setLoading(true);
      const response = await NetworkRespository.analysis(dataId, params);
      setLoading(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      setAnalysis({ ...response!.data, params });
      setError(undefined);
    }
  };

  const renderAnalysis = (): JSX.Element => (
    <BouncerWrapper showBouncer={loading}>
      {error ?? null}
      {analysis && (
        <div className="row pt-3 pb-3">
          {LABELS.map(([key, label]) => (
            <div key={key} className="col-md-6 network-analysis">
              <ul>
                <li>{buildStat(t, label, analysis?.[key])}</li>
              </ul>
            </div>
          ))}
        </div>
      )}
    </BouncerWrapper>
  );

  const title = (
    <React.Fragment>
      {t('Network Analysis ')}
      <small>({t('expand to load')})</small>
    </React.Fragment>
  );

  return (
    <div className="row pb-5" data-testid="network-analysis">
      <div className="col-md-12">
        <Collapsible title={title} content={renderAnalysis()} onExpand={loadAnalysis} />
      </div>
    </div>
  );
};

export default withTranslation('network')(NetworkAnalysis);
