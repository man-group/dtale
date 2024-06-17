import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { createFilter, default as Select } from 'react-select';

import { BouncerWrapper } from '../BouncerWrapper';
import { DataViewerPropagateState } from '../dtale/DataViewerState';
import { updateXArrayDimAction } from '../redux/actions/dtale';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectDataId, selectXArrayDim } from '../redux/selectors';
import { RemovableError } from '../RemovableError';
import * as XArrayRepository from '../repository/XArrayRepository';

/** Component properties for XArrayDimensions */
interface XArrayDimensionsProps {
  propagateState: DataViewerPropagateState;
}

const convertCurrentSelections = (selections: Record<string, { value?: any }>): Record<string, any> =>
  Object.keys(selections).reduce(
    (res, prop) => ({ ...res, ...(selections[prop].value !== undefined ? { [prop]: selections[prop].value } : {}) }),
    {},
  );

const selectResult = createSelector([selectDataId, selectXArrayDim], (dataId, xarrayDim) => ({ dataId, xarrayDim }));

const XArrayDimensions: React.FC<XArrayDimensionsProps & WithTranslation> = ({ propagateState, t }) => {
  const reduxState = useAppSelector(selectResult);
  const { dataId } = reduxState;
  const dispatch = useAppDispatch();

  const [xarrayDim, setXarrayDim] = React.useState<Record<string, { value: any }>>(
    Object.keys(reduxState.xarrayDim).reduce(
      (res: Record<string, { value: any }>, key: string) => ({ ...res, [key]: { value: reduxState.xarrayDim[key] } }),
      {},
    ),
  );
  const [coordinates, setCoordinates] = React.useState<XArrayRepository.XArrayCoordinate[]>([]);
  const [dimension, setDimension] = React.useState<string>();
  const [dimensionData, setDimensionData] = React.useState<Array<{ value: any }>>();
  const [loadingCoordinates, setLoadingCoordinates] = React.useState<boolean>(true);
  const [loadingDimension, setLoadingDimension] = React.useState<boolean>(false);
  const [error, setError] = React.useState<JSX.Element>();

  React.useEffect(() => {
    (async () => {
      const response = await XArrayRepository.getCoordinates(dataId);
      setLoadingCoordinates(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      setCoordinates(response?.data ?? []);
    })();
  }, []);

  const viewDimension = (dimensionName: string): void => {
    setDimension(dimensionName);
    setLoadingDimension(true);
    XArrayRepository.getDimensionValues(dataId, dimensionName).then((response) => {
      setLoadingDimension(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      setDimensionData(response?.data);
    });
  };

  React.useEffect(() => {
    if (coordinates.length) {
      viewDimension(coordinates[0].name);
    }
  }, [coordinates]);

  const save = async (): Promise<void> => {
    const updatedSelection = convertCurrentSelections(xarrayDim);
    const response = await XArrayRepository.updateDimensionSelection(dataId, updatedSelection);
    if (response?.error) {
      setError(<RemovableError {...response} />);
      return;
    }
    dispatch(updateXArrayDimAction(updatedSelection));
    propagateState({ refresh: true });
  };

  const canSave = convertCurrentSelections(xarrayDim) !== reduxState.xarrayDim;
  return (
    <React.Fragment>
      <div className="modal-body" data-testid="xarray-dimensions-body">
        {error}
        <BouncerWrapper showBouncer={loadingCoordinates}>
          <div className="row">
            <div className="col-md-12">
              <ul className="list-group">
                {coordinates.map(({ name, count, dtype }) => (
                  <li
                    key={`dim-${name}`}
                    className={`list-group-item ${dimension === name ? 'active' : 'pointer'}`}
                    {...(dimension === name ? {} : { onClick: () => viewDimension(name) })}
                  >
                    <div className="row">
                      <div className="col-md-6">
                        <span className="font-weight-bold" style={{ fontSize: '18px' }}>
                          {name}
                        </span>
                        <div>{`(${t('count')}: ${count}, ${t('dtype')}: ${dtype})`}</div>
                      </div>
                      <div className="col-md-6">
                        <BouncerWrapper showBouncer={loadingDimension && dimension === name}>
                          <Select
                            className="Select is-clearable is-searchable Select--single"
                            isDisabled={dimension !== name}
                            classNamePrefix="Select"
                            options={dimension === name ? dimensionData || [] : []}
                            getOptionLabel={(option: { value: any }) => option.value}
                            getOptionValue={(option: { value: any }) => option.value}
                            value={xarrayDim[name] ?? null}
                            onChange={(selected: { value: any } | null) => {
                              let updatedXarrayDim: Record<string, { value: any }> = {};
                              if (selected) {
                                updatedXarrayDim = { ...xarrayDim, [name]: selected };
                              } else {
                                updatedXarrayDim = { ...xarrayDim };
                                delete updatedXarrayDim[name];
                              }
                              setXarrayDim(updatedXarrayDim);
                            }}
                            noOptionsMessage={() => t('No dimensions found')}
                            isClearable={true}
                            filterOption={createFilter({
                              ignoreAccents: false,
                            })} // required for performance reasons!
                          />
                        </BouncerWrapper>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </BouncerWrapper>
      </div>
      <div className="modal-footer" data-testid="xarray-dimensions-footer">
        <button className="btn btn-primary" disabled={!canSave} onClick={save}>
          <span>{t('Update Dimensions')}</span>
        </button>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('xarray')(XArrayDimensions);
