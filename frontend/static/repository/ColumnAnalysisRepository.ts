import { AnalysisCharts } from '../popups/analysis/ColumnAnalysisState';
import { buildURLParams } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Axios response for column analysis */
export type ColumnAnalysisResponse = GenericRepository.BaseResponse & AnalysisCharts;

const BASE_ANALYSIS_URL = '/dtale/column-analysis';

const PARAM_PROPS = ['selectedCol', 'bins', 'top', 'type', 'ordinalCol', 'ordinalAgg', 'categoryCol'].concat([
  'categoryAgg',
  'cleaners',
  'latCol',
  'lonCol',
  'target',
  'filtered',
  'density',
  'splits',
]);

/**
 * Load column analysis for a sepcific data instance and set of parameters.
 *
 * @param dataId the identifier of the data instance you would like the column analysis for.
 * @param params the additional URL parameters for the column analysis.
 * @return data used to populate the UI for a column analysis.
 */
export async function loadAnalysis(
  dataId: string,
  params: Record<string, any>,
): Promise<ColumnAnalysisResponse | undefined> {
  const url = `${BASE_ANALYSIS_URL}/${dataId}?${new URLSearchParams(buildURLParams(params, PARAM_PROPS)).toString()}`;
  return await GenericRepository.getDataFromService<ColumnAnalysisResponse>(url);
}
