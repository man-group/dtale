import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

/** Component properties for HighlightOption */
interface HighlightOptionProps extends MenuOptionProps {
  label: string;
  current?: string;
  mode: string;
}

const HighlightOption: React.FC<HighlightOptionProps & WithTranslation> = ({ label, current, mode, open, t }) => (
  <MenuItem description={t(`menu_description:highlight_${mode}`)} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <div style={{ display: 'inherit' }}>
          <div className={`bg-icon ${mode}-bg${current === mode ? ' spin' : ''}`} />
          <span className="font-weight-bold pl-4">{t(`Highlight ${label}`, { ns: 'menu' })}</span>
        </div>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(HighlightOption);
