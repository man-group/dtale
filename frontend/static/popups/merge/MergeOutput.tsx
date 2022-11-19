import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { default as python } from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { default as docco } from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';
import { AnyAction } from 'redux';

SyntaxHighlighter.registerLanguage('python', python);

import { BouncerWrapper } from '../../BouncerWrapper';
import { ColumnDef } from '../../dtale/DataViewerState';
import * as mergeActions from '../../redux/actions/merge';
import { MergeActionType, ToggleShowCodeAction } from '../../redux/actions/MergeActions';
import { Dataset, MergeConfig, MergeConfigType, MergeState, StackConfig } from '../../redux/state/MergeState';
import { capitalize } from '../../stringUtils';
import { jumpToDataset } from '../upload/uploadUtils';

import { DataPreview } from './DataPreview';

const buildCode = (
  action: MergeConfigType,
  datasets: Dataset[],
  mergeConfig: MergeConfig,
  stackConfig: StackConfig,
  name: string,
): string[] => {
  let code = ['import dtale', 'from dtale.views import startup\n'];
  const colNames = (cols: ColumnDef[]): string[] => cols.map((col) => col.name);
  const buildIdx = (index: ColumnDef[]): string =>
    action === MergeConfigType.MERGE && index ? `.set_index(['${colNames(index).join("','")}'])` : '';

  datasets.forEach(({ dataId, columns, index }, i) => {
    let cols: string[] = [];
    if (action === MergeConfigType.MERGE && columns?.length) {
      cols = [...new Set(colNames([...columns, ...index]))];
    } else if (action === 'stack' && columns?.length) {
      cols = colNames(columns);
    }
    const colStr = cols.length ? `[['${cols.join("','")}']]` : '';
    code.push(`df${i + 1} = dtale.get_instance('${dataId}').data${colStr}${buildIdx(index)}`);
  });

  if (action === MergeConfigType.MERGE) {
    const { how, sort, indicator } = mergeConfig;
    const buildMerge = (df1: string, df2: string, left: Dataset | undefined, right: Dataset, idx = 1): string => {
      let suffixes = '';
      if (left?.suffix || right.suffix) {
        const suffixStr = (suffix?: string | null): string => (suffix ? `'${suffix}'` : 'None');
        suffixes = `, suffixes=[${suffixStr(left?.suffix)},${suffixStr(right.suffix)}]`;
      }
      let cmd = `final_df = ${df1}.merge(${df2}, how='${how}', left_index=True, right_index=True`;
      const sortParam = sort ? `, sort=True` : '';
      const indicatorParam = indicator ? `, indicator='merge_${idx}'` : '';
      cmd += `${sortParam}${indicatorParam}${suffixes})`;
      return cmd;
    };
    code.push(buildMerge('df1', 'df2', datasets[0], datasets[1]));
    if (datasets.length > 2) {
      code = [
        ...code,
        ...datasets.slice(0, 2).map((d, i) => buildMerge('final_df', `df${i + 3}`, undefined, d, i + 2)),
      ];
    }
  } else if (action === MergeConfigType.STACK) {
    const { ignoreIndex } = stackConfig;
    const ignoreIndexParam = ignoreIndex ? `, ignore_index=True` : '';
    code.push(`final_df = pd.concat([${datasets.map((_, i) => `df${i + 1}`).join(',')}]${ignoreIndexParam})`);
  }
  code.push(`startup(final_df${name ? `, name='${name}'` : ''})`);
  return code;
};

const MergeOutput: React.FC<WithTranslation> = ({ t }) => {
  const { action, datasets, loadingMerge, mergeConfig, stackConfig, mergeDataId, showCode } = useSelector(
    (state: MergeState) => ({ ...state }),
  );
  const dispatch = useDispatch();
  const buildMerge = (name: string): AnyAction => dispatch(mergeActions.buildMerge(name) as any as AnyAction);
  const clearMerge = (): AnyAction => dispatch(mergeActions.clearMerge() as any as AnyAction);
  const toggleShowCode = (): ToggleShowCodeAction => dispatch({ type: MergeActionType.TOGGLE_SHOW_CODE });
  const [name, setName] = React.useState('');
  const code = React.useMemo(
    () => buildCode(action, datasets, mergeConfig, stackConfig, name).join('\n'),
    [action, datasets, mergeConfig, stackConfig, name],
  );

  return (
    <ul className="list-group ml-3 mr-3 pt-3" data-testid="merge-output">
      <li className="list-group-item p-3 section">
        <div className="row ml-0 mr-0">
          <div className="col-auto pl-4 pr-0">
            <h3 className="m-auto">{`${t(capitalize(action))} ${t('Output')}`}</h3>
          </div>
        </div>
        <div className="form-group row p-4 ml-0 mr-0 mb-0">
          <label className="col-form-label text-right">{t('Name')}</label>
          <div className="col-md-4">
            <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="col" />
          {loadingMerge && (
            <div className="col-auto">
              <BouncerWrapper showBouncer={loadingMerge} />
            </div>
          )}
          <div className="col-auto">
            <button className="btn-sm btn-primary pointer" onClick={() => buildMerge(name)}>
              <i className="ico-remove-circle pr-3" />
              <span>{`${t('Build')} ${t(capitalize(action))}`}</span>
            </button>
          </div>
        </div>
        <div className="row p-4 ml-0 mr-0">
          <div className="col-md-12 p-0">
            <dl className="dataset accordion pt-3">
              <dt
                className={`dataset accordion-title${showCode ? ' is-expanded' : ''} pointer pl-3`}
                onClick={toggleShowCode}
              >
                {t('Code')}
              </dt>
              <dd className={`p-0 dataset accordion-content${showCode ? ' is-expanded' : ''}`}>
                <div className="row pt-4 ml-0 mr-0">
                  <div className="col-md-12">
                    <SyntaxHighlighter language="python" style={docco}>
                      {code}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </dd>
            </dl>
          </div>
        </div>
        {mergeDataId && (
          <React.Fragment>
            <div className="row p-4 ml-0 mr-0">
              <div className="col" />
              <div className="col-auto">
                <button className="btn btn-primary pointer" onClick={() => jumpToDataset(mergeDataId, undefined, true)}>
                  <span>{t('Keep Data & Jump To Grid')}</span>
                </button>
              </div>
              <div className="col-auto">
                <button className="btn btn-secondary pointer" onClick={clearMerge}>
                  <span>{t('Clear Data & Keep Editing')}</span>
                </button>
              </div>
              <div className="col" />
            </div>
            <div className="row p-4 ml-0 mr-0">
              <div className="col-md-12 p-0" style={{ height: 200 }}>
                <DataPreview dataId={`${mergeDataId}`} />
              </div>
            </div>
          </React.Fragment>
        )}
      </li>
    </ul>
  );
};

export default withTranslation('merge')(MergeOutput);
