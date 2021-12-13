import * as React from 'react';
import { TFunction, withTranslation } from 'react-i18next';

import { GroupColor } from './NetworkState';

/** Component properties for GroupsLegend */
interface GroupsLegendProps {
  groups?: GroupColor[];
  t: TFunction;
}

const GroupsLegend: React.FC<GroupsLegendProps> = ({ groups, t }) => (
  <React.Fragment>
    {!!groups?.length && (
      <div className="groups-legend">
        <div className="row">
          <div className="font-weight-bold col-md-12">{t('Groups')}</div>
          {groups.map(([group, color], i) => (
            <div key={i} className="col-md-12">
              <div
                style={{
                  border: `1px solid ${color.border}`,
                  background: color.background,
                }}
                className="d-inline pl-4"
              />
              <div className="pl-3 d-inline">{group}</div>
            </div>
          ))}
        </div>
      </div>
    )}
  </React.Fragment>
);
export default withTranslation('network')(GroupsLegend);
