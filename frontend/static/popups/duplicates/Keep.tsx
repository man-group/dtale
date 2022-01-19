import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';
import { capitalize } from '../../stringUtils';
import { LabeledSelect } from '../create/LabeledSelect';

import { KeepType } from './DuplicatesState';

/** Component properties for Keep */
interface KeepProps {
  value: KeepType;
  setKeep: (keep: KeepType) => void;
}

const Keep: React.FC<KeepProps & WithTranslation> = ({ t, ...props }) => {
  const options = React.useMemo(
    () => Object.values(KeepType).map((value) => ({ value, label: t(capitalize(value)) })),
    [t],
  );
  const [value, setValue] = React.useState<BaseOption<KeepType>>(
    options.find((option) => option.value === props.value)!,
  );

  return (
    <LabeledSelect
      label={t('Keep')}
      options={options}
      value={value}
      onChange={(selected): void => {
        setValue(selected as BaseOption<KeepType>);
        props.setKeep((selected as BaseOption<KeepType>).value);
      }}
      isClearable={false}
    />
  );
};

export default withTranslation('duplicate')(Keep);
