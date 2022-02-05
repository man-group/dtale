import { buildURLString } from '../redux/actions/url-utils';
import { BaseOption } from '../redux/state/AppState';

import * as GenericRepository from './GenericRepository';

/** Axios response for executing Gage R&R report */
export interface GageRnRReport extends GenericRepository.BaseResponse {
  columns: Array<{ dtype: string; name: string }>;
  results: Array<{ [key: string]: string | number }>;
}

/**
 * Loads the results of a Gage R & R report.
 *
 * @param dataId the identifier of the data instance you would like.
 * @param operator operator
 * @param measurements measurements
 * @param filtered whether to apply the current filters to the data.
 * @return iGage R&R report results.
 */
export async function run(
  dataId: string,
  operator: Array<BaseOption<string>>,
  measurements: Array<BaseOption<string>>,
  filtered: boolean,
): Promise<GageRnRReport | undefined> {
  return await GenericRepository.getDataFromService<GageRnRReport>(
    buildURLString(`/dtale/gage-rnr/${dataId}`, {
      operator: JSON.stringify(operator.map(({ value }) => value)),
      measurements: JSON.stringify(measurements.map(({ value }) => value)),
      filtered: `${filtered}`,
    }),
  );
}
