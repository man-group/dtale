import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { default as python } from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { default as docco } from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';

SyntaxHighlighter.registerLanguage('python', python);

import ButtonToggle from '../../ButtonToggle';
import { ConfigUpdateProps, MergeActions } from '../../redux/actions/MergeActions';
import { useMergeDispatch, useMergeSelector } from '../../redux/hooks';
import { selectAction, selectMergeConfig, selectStackConfig } from '../../redux/mergeSelectors';
import { HowToMerge, MergeConfigType } from '../../redux/state/MergeState';
import { capitalize } from '../../stringUtils';

import ExampleCode from './code.json';

/** Component properties for ExampleToggle */
interface ExampleToggleProps {
  show: boolean;
  setShow: (show: boolean) => void;
  codeKey: string;
}

const selectResult = createSelector(
  [selectAction, selectMergeConfig, selectStackConfig],
  (action, mergeConfig, stackConfig) => ({ action, mergeConfig, stackConfig }),
);

const BaseExampleToggle: React.FC<React.PropsWithChildren<ExampleToggleProps & WithTranslation>> = ({
  show,
  setShow,
  children,
  codeKey,
  t,
}) => {
  return (
    <dl className="dataset accordion pt-3">
      <dt
        className={`dataset accordion-title${show ? ' is-expanded' : ''} pointer pl-3`}
        onClick={() => setShow(!show)}
      >
        {t('Example')}
      </dt>
      <dd className={`p-0 dataset accordion-content${show ? ' is-expanded' : ''} example`}>
        <div className="row pt-4 ml-0 mr-0">
          <div className="col-auto">{children}</div>
          <div className="col-auto">
            <SyntaxHighlighter language="python" style={docco}>
              {(ExampleCode as any)[codeKey].join('\n')}
            </SyntaxHighlighter>
          </div>
        </div>
      </dd>
    </dl>
  );
};
export const ExampleToggle = withTranslation('merge')(BaseExampleToggle);

const exampleImage = (name: string): string =>
  `https://raw.githubusercontent.com/aschonfeld/dtale-media/master/merge_images/${name}.png`;

// Look to add images from pandas documentation: https://pandas.pydata.org/pandas-docs/stable/user_guide/merging.html
// Example image URL: https://pandas.pydata.org/pandas-docs/stable/_images/merging_join_multi_df.png

const ActionConfig: React.FC<WithTranslation> = ({ t }) => {
  const { action, mergeConfig, stackConfig } = useMergeSelector(selectResult);
  const dispatch = useMergeDispatch();
  const updateActionType = (updatedAction: MergeConfigType): PayloadAction<MergeConfigType> =>
    dispatch(MergeActions.UpdateMergeActionTypeAction(updatedAction));
  const updateActionConfig = <T,>(updatedConfig: ConfigUpdateProps<T>): PayloadAction<ConfigUpdateProps> =>
    dispatch(MergeActions.ConfigUpdateAction({ ...updatedConfig }));
  const [howOpts, actionOpts] = React.useMemo(() => {
    return [
      Object.values(HowToMerge).map((h) => ({ value: h, label: t(capitalize(h)) })),
      Object.values(MergeConfigType).map((m) => ({ value: m, label: t(capitalize(m)) })),
    ];
  }, [t]);

  const [example, setExample] = React.useState(false);

  const renderMerge = (): JSX.Element => {
    const { how, sort, indicator } = mergeConfig;
    return (
      <React.Fragment>
        <div className="row ml-0 mr-0">
          <div className="col-md-4">
            <div className="form-group row" data-testid="how-toggle">
              <label className="col-auto col-form-label text-right pr-0">{t('How')}:</label>
              <ButtonToggle
                options={howOpts}
                update={(value) => updateActionConfig({ action, prop: 'how', value } as ConfigUpdateProps<HowToMerge>)}
                defaultValue={how}
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="form-group row">
              <label className="col-auto col-form-label text-right pr-5">{t('Sort')}:</label>
              <i
                className={`ico-check-box${sort ? '' : '-outline-blank'} pointer mb-auto mt-auto`}
                onClick={() => updateActionConfig({ action, prop: 'sort', value: !sort } as ConfigUpdateProps<boolean>)}
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="form-group row">
              <label className="col-md-3 col-form-label text-right pr-5">{t('Indicator')}:</label>
              <i
                className={`ico-check-box${indicator ? '' : '-outline-blank'} pointer mb-auto mt-auto`}
                onClick={() =>
                  updateActionConfig({
                    action,
                    prop: 'indicator',
                    value: !indicator,
                  } as ConfigUpdateProps<boolean>)
                }
              />
            </div>
          </div>
        </div>
        <ExampleToggle show={example} setShow={setExample} codeKey={how}>
          {how === HowToMerge.INNER && <img src={exampleImage('merging_merge_on_key_multiple')} />}
          {how === HowToMerge.LEFT && <img src={exampleImage('merging_merge_on_key_left')} />}
          {how === HowToMerge.RIGHT && <img src={exampleImage('merging_merge_on_key_right')} />}
          {how === HowToMerge.OUTER && <img src={exampleImage('merging_merge_on_key_outer')} />}
        </ExampleToggle>
      </React.Fragment>
    );
  };

  const renderStack = (): JSX.Element => {
    const { ignoreIndex } = stackConfig;
    return (
      <React.Fragment>
        <div className="row ml-0 mr-0">
          <div className="col-md-6">
            <div className="form-group row">
              <label className="col-auto col-form-label text-right pr-3">{t('Ignore Index')}:</label>
              <i
                className={`ico-check-box${ignoreIndex ? '' : '-outline-blank'} pointer mb-auto mt-auto`}
                onClick={() =>
                  updateActionConfig({
                    action,
                    prop: 'ignoreIndex',
                    value: !ignoreIndex,
                  } as ConfigUpdateProps<boolean>)
                }
              />
            </div>
          </div>
        </div>
        <ExampleToggle show={example} setShow={setExample} codeKey="stack">
          <img src={exampleImage('merging_concat_basic')} />
        </ExampleToggle>
      </React.Fragment>
    );
  };

  return (
    <ul className="list-group ml-3 mr-3 pt-3" data-testid="action-config">
      <li className="list-group-item p-3 section">
        <div className="row ml-0 mr-0">
          <div className="col-auto pl-4 pr-0">
            <h3 className="m-auto">{t('Action')}</h3>
          </div>
          <ButtonToggle
            options={actionOpts}
            update={(updatedAction) => updateActionType(updatedAction)}
            defaultValue={action}
          />
          <div className="col" />
        </div>
        <ul className="list-group p-4">
          <li className="list-group-item">
            {action === 'merge' && renderMerge()}
            {action === 'stack' && renderStack()}
          </li>
        </ul>
      </li>
    </ul>
  );
};

export default withTranslation('merge')(ActionConfig);
