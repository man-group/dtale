import { DataSpec } from '../chartUtils';
import { buildURLString } from '../redux/actions/url-utils';
import { BaseOption } from '../redux/state/AppState';

import * as GenericRepository from './GenericRepository';

const CHARTS_URL = '/dtale/chart-data/';

export const buildUrl = (dataId: string, params: Record<string, string>): string =>
  buildURLString(`${CHARTS_URL}${dataId}`, params);

/** Axios response for loading chart data */
type ChartsResponse = DataSpec & GenericRepository.BaseResponse;

/**
 * Load information related to charts.
 *
 * @param url the url to load chart data from.
 * @param chartType the type of chart to load (if scatter then allow for duplicate data)
 * @return chart data.
 */
export async function load(url: string, chartType?: BaseOption<string>): Promise<ChartsResponse | undefined> {
  return await GenericRepository.getDataFromService<ChartsResponse>(
    `${url}${chartType?.value === 'scatter' ? '&allowDupes=true' : ''}`,
  );
}
