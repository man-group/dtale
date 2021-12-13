import * as React from 'react';
import { TFunction, withTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { AppState } from '../redux/state/AppState';
import { RemovableError } from '../RemovableError';
import * as NetworkRepository from '../repository/NetworkRespository';

import { NetworkNode, ValueHolder } from './NetworkState';

/** Component properties for ShortestPath */
interface ShortestPathProps {
  to?: ValueHolder<string>;
  from?: ValueHolder<string>;
  nodes: number[];
  allNodes?: Record<string, NetworkNode>;
  highlightPath: (path: string[]) => void;
  clearPath: () => void;
  t: TFunction;
}

const ShortestPath: React.FC<ShortestPathProps> = ({ to, from, nodes, allNodes, highlightPath, clearPath, t }) => {
  const dataId = useSelector((state: AppState) => state.dataId);
  const [shortestPath, setShortestPath] = React.useState<string[]>();
  const [error, setError] = React.useState<JSX.Element>();
  const [start, setStart] = React.useState<string>();
  const [end, setEnd] = React.useState<string>();

  React.useEffect(() => {
    if (nodes.length === 2) {
      const params: Record<string, string> = {
        to: to?.value ?? '',
        from: from?.value ?? '',
        start: allNodes?.[nodes[0]].label ?? '',
        end: allNodes?.[nodes[1]].label ?? '',
      };
      (async (): Promise<void> => {
        const response = await NetworkRepository.shortestPath(dataId, params);
        if (response?.error) {
          setError(<RemovableError {...response} onRemove={() => setError(undefined)} />);
          return;
        }
        setShortestPath(response?.data ?? []);
        setStart(params.start);
        setEnd(params.end);
        setError(undefined);
        highlightPath(response?.data ?? []);
      })();
    }
  }, [nodes]);

  if (shortestPath) {
    return (
      <div className="row m-3 mt-3 shortest-path">
        <div className="col">
          {`${t('Shortest path between nodes')} ${start} & ${end}: `}
          <b>{shortestPath.join(' -> ')}</b>
        </div>
        <div className="col-auto">
          <i
            className="ico-close pointer"
            onClick={() => {
              setShortestPath(undefined);
              clearPath();
            }}
          />
        </div>
      </div>
    );
  }
  return error ?? null;
};

export default withTranslation('network')(ShortestPath);
