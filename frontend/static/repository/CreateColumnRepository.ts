import { HistogramChartData } from '../popups/analysis/ColumnAnalysisState';
import { CreateColumnSaveParams } from '../popups/create/CreateColumnState';
import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Axios response for testing a bin column creation configuration */
export type TestBinsResponse = GenericRepository.BaseResponse & HistogramChartData;

/**
 * Load bins information for a specific column on a data instance.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param cfg the configuration for the bins specificication.
 * @return bin counts and labels.
 */
export async function testBins(dataId: string, cfg: Record<string, any>): Promise<TestBinsResponse | undefined> {
  return await GenericRepository.getDataFromService<TestBinsResponse>(
    buildURLString(`/dtale/bins-tester/${dataId}`, { type: 'bins', cfg: JSON.stringify(cfg) }),
  );
}

/** Axios response for saving a created column */
export interface SaveResponse extends GenericRepository.BaseResponse {
  data_id?: string;
}

/**
 * Create & save a column created from a column creation configuration.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param params the configuration of the column being created.
 * @param route the API route we're using for saving.
 * @return the data identifier of the new data created if exists, response status otherwise.
 */
export async function save(
  dataId: string,
  params: CreateColumnSaveParams,
  route = 'build-column',
): Promise<SaveResponse | undefined> {
  return await GenericRepository.getDataFromService<SaveResponse>(
    buildURLString(`/dtale/${route}/${dataId}`, { ...params, cfg: JSON.stringify(params.cfg) }),
  );
}
