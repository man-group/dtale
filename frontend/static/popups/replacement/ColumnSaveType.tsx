import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { SaveAs, SaveAsProps } from '../create/CreateColumnState';

/** Component properties for ColumnSaveType */
interface ColumnSaveAsProps {
  saveAs?: SaveAs;
  name?: string;
  propagateState: (state: SaveAsProps) => void;
}

const ColumnSaveType: React.FC<ColumnSaveAsProps & WithTranslation> = ({ t, ...props }) => {
  const [saveAs, setSaveAs] = React.useState(props.saveAs ?? SaveAs.INPLACE);
  const [name, setName] = React.useState(props.name);

  const saveTypes = React.useMemo(
    () => [
      { value: SaveAs.INPLACE, label: t('Inplace') },
      { value: SaveAs.NEW, label: t('New Column') },
    ],
    [t],
  );

  React.useEffect(() => {
    setName(props.name);
  }, [props.name]);

  return (
    <div className="form-group row">
      <label className="col-md-3 col-form-label text-right">{t('Save As')}</label>
      <div className="col-md-8">
        <div className="row">
          <ButtonToggle
            options={saveTypes}
            update={(value: SaveAs) => {
              setSaveAs(value);
              props.propagateState({ saveAs: value, name });
            }}
            defaultValue={saveAs}
            compact={false}
            style={{ height: 'fit-content' }}
          />
          <div className="col">
            {saveAs === SaveAs.NEW && (
              <input
                type="text"
                data-testid="new-column-name"
                className="form-control"
                value={name || ''}
                onChange={(e) => {
                  setName(e.target.value);
                  props.propagateState({ saveAs, name: e.target.value });
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withTranslation('replacement')(ColumnSaveType);
