import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** XArray coordinate properties  */
export interface XArrayCoordinate {
  name: string;
  count: number;
  dtype: string;
}

/** Axios reponse for loading xarray coordinates */
export interface XArrayCoordinatesResponse extends GenericRepository.BaseResponse {
  data: XArrayCoordinate[];
}

/**
 * Load XArray coordinates
 *
 * @param dataId the identifier of the data instance you would like the xarray coordinates for.
 * @return xarray coordinates.
 */
export async function getCoordinates(dataId: string): Promise<XArrayCoordinatesResponse | undefined> {
  return await GenericRepository.getDataFromService<XArrayCoordinatesResponse>(`/dtale/xarray-coordinates/${dataId}`);
}

/** Axios response for loading xarray dimension values */
export interface XArrayDimensionValuesResponse extends GenericRepository.BaseResponse {
  data: Array<{ value: any }>;
}

/**
 * Load values for XArray dimension.
 *
 * @param dataId the identifier of the data instance you would like the xarray dimension values for.
 * @param dimension the name of the dimension to load the values for.
 * @return xarray dimension values.
 */
export async function getDimensionValues(
  dataId: string,
  dimension: string,
): Promise<XArrayDimensionValuesResponse | undefined> {
  return await GenericRepository.getDataFromService<XArrayDimensionValuesResponse>(
    `/dtale/xarray-dimension-values/${dataId}/${dimension}`,
  );
}

/**
 * Update the selected XArray dimension.
 *
 * @param dataId the identifier of the data instance you would like the xarray dimension values for.
 * @param selection the current xarray dimension selections.
 * @return response status.
 */
export async function updateDimensionSelection(
  dataId: string,
  selection: Record<string, boolean>,
): Promise<GenericRepository.BaseResponse | undefined> {
  return await GenericRepository.getDataFromService<GenericRepository.BaseResponse>(
    buildURLString(`/dtale/update-xarray-selection/${dataId}`, { selection: JSON.stringify(selection) }),
  );
}

/**
 * Update the selected XArray dimension.
 *
 * @param dataId the identifier of the data instance you would like the xarray dimension values for.
 * @param indexes the current xarray index selections.
 * @return response status.
 */
export async function toXarray(
  dataId: string,
  indexes: Array<{ value: string }>,
): Promise<GenericRepository.BaseResponse | undefined> {
  return await GenericRepository.getDataFromService<GenericRepository.BaseResponse>(
    buildURLString(`/dtale/to-xarray/${dataId}`, { index: JSON.stringify(indexes.map((index) => index.value)) }),
  );
}
