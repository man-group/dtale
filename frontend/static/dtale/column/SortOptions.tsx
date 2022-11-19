import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { AnyAction } from 'redux';

import * as settingsActions from '../../redux/actions/settings';
import { InstanceSettings, SortDef, SortDir } from '../../redux/state/AppState';
import * as menuFuncs from '../menu/dataViewerMenuUtils';

/** Component properties of SortOptions */
interface SortOptionsProps {
  sortInfo?: SortDef[];
  selectedCol: string;
}

const SortOptions: React.FC<SortOptionsProps & WithTranslation> = ({ sortInfo, selectedCol, t }) => {
  const dispatch = useDispatch();
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): AnyAction =>
    dispatch(settingsActions.updateSettings(updatedSettings) as any as AnyAction);
  const currDir = sortInfo?.find(([col, _dir]) => selectedCol === col)?.[1];

  const renderBtn = (active: boolean, label: string, dir?: SortDir): JSX.Element => {
    return (
      <button
        style={active ? {} : { color: '#565b68' }}
        className={`btn btn-primary ${active ? 'active' : ''} font-weight-bold`}
        onClick={active ? () => ({}) : () => menuFuncs.updateSort([selectedCol], dir, sortInfo ?? [], updateSettings)}
        disabled={active}
      >
        {t(label, { ns: 'column_menu' })}
      </button>
    );
  };
  return (
    <li>
      <span className="toggler-action">
        <i className="fa fa-sort ml-4 mr-4" />
      </span>
      <div className="btn-group compact m-auto font-weight-bold column-sorting">
        {renderBtn(currDir === SortDir.ASC, 'Asc', SortDir.ASC)}
        {renderBtn(currDir === SortDir.DESC, 'Desc', SortDir.DESC)}
        {renderBtn(currDir === undefined, 'None')}
      </div>
    </li>
  );
};

export default withTranslation('column_menu')(SortOptions);
