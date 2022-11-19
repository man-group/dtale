import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import * as actions from '../../redux/actions/dtale';
import { AppState } from '../../redux/state/AppState';
import { SingleTrack, StyledSlider, Thumb } from '../../sliderUtils';
import * as serverState from '../serverStateManagement';

import { MenuItem } from './MenuItem';

/** Component properties for MaxDimensionOption */
interface MaxDimensionOptionProps {
  maxDimension: number | null;
  label: string;
  description: string;
  icon: string;
  updateMaxDimension: (value: number) => Promise<void>;
  clearMaxDimension: () => void;
}

export const MaxDimensionOption: React.FC<MaxDimensionOptionProps & WithTranslation> = ({
  label,
  description,
  icon,
  updateMaxDimension,
  clearMaxDimension,
  t,
  ...props
}) => {
  const [maxDimension, setMaxDimension] = React.useState(props.maxDimension ?? 100);

  React.useEffect(() => setMaxDimension(props.maxDimension ?? 100), [props.maxDimension]);

  const updateMax = async (value: number): Promise<void> => {
    setMaxDimension(value);
    await updateMaxDimension(value);
  };

  const checkBoxClick = async (): Promise<void> => {
    if (props.maxDimension === null) {
      updateMax(maxDimension);
    } else {
      clearMaxDimension();
    }
  };

  return (
    <MenuItem style={{ color: '#565b68' }} description={t(`menu_description:max_${description}`)}>
      <span className="toggler-action">
        <i className={`fas fa-arrows-alt-${icon}`} />
      </span>
      <div className="w-100">
        <div className="row m-0">
          <span className="font-weight-bold col">
            {t(`Max ${label}`, { ns: 'menu' })}
            <small className="pl-2">(px)</small>
          </span>
          <i
            className={`ico-check-box${
              props.maxDimension === null ? '-outline-blank' : ''
            } col-auto pointer mb-auto mt-auto`}
            onClick={checkBoxClick}
          />
        </div>
        <div className="row m-0 mb-3" data-tip={t('Press ENTER to submit', { ns: 'text_enter' })}>
          <input
            type="text"
            className="form-control ml-3 slider-input col-auto pt-0 pb-0 pl-3 pr-3 align-center"
            style={{ width: '3em' }}
            value={`${maxDimension}`}
            onChange={(e) => {
              const parsedInt = parseInt(e.target.value, 10);
              if (!isNaN(parsedInt)) {
                setMaxDimension(parsedInt);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && maxDimension) {
                updateMax(maxDimension);
              }
            }}
          />
          <div className="col pl-3 pr-2" data-testid={`${description}-slider`}>
            <StyledSlider
              defaultValue={maxDimension}
              renderTrack={SingleTrack as any}
              renderThumb={Thumb}
              max={1000}
              value={maxDimension}
              onAfterChange={(updatedMaxDimension) => updateMax(updatedMaxDimension as number)}
            />
          </div>
        </div>
      </div>
    </MenuItem>
  );
};

const TranslatedMaxDimensionOption = withTranslation(['menu', 'menu_description', 'text_enter'])(MaxDimensionOption);

export const MaxWidthOption: React.FC = () => {
  const maxColumnWidth = useSelector((state: AppState) => state.maxColumnWidth);
  const dispatch = useDispatch();
  const updateMaxDimension = async (width: number): Promise<void> => {
    dispatch(actions.updateMaxWidth(width) as any as AnyAction);
    await serverState.updateMaxColumnWidth(width);
  };
  const clearMaxDimension = async (): Promise<void> => {
    dispatch(actions.clearMaxWidth() as any as AnyAction);
    await serverState.updateMaxColumnWidth();
  };
  return (
    <TranslatedMaxDimensionOption
      label="Width"
      description="width"
      icon="h mr-4 ml-1'"
      maxDimension={maxColumnWidth}
      updateMaxDimension={updateMaxDimension}
      clearMaxDimension={clearMaxDimension}
    />
  );
};

export const MaxHeightOption: React.FC = () => {
  const maxRowHeight = useSelector((state: AppState) => state.maxRowHeight);
  const dispatch = useDispatch();
  const updateMaxDimension = async (height: number): Promise<void> => {
    dispatch(actions.updateMaxHeight(height) as any as AnyAction);
    await serverState.updateMaxRowHeight(height);
  };
  const clearMaxDimension = async (): Promise<void> => {
    dispatch(actions.clearMaxHeight() as any as AnyAction);
    await serverState.updateMaxRowHeight();
  };
  return (
    <TranslatedMaxDimensionOption
      label="Height"
      description="height"
      icon="v mr-5 ml-3'"
      maxDimension={maxRowHeight}
      updateMaxDimension={updateMaxDimension}
      clearMaxDimension={clearMaxDimension}
    />
  );
};
