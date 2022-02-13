import * as GenericRepository from './GenericRepository';

/** Axios response object for copying a range from the grid */
interface CopyRangeResponse extends GenericRepository.BaseResponse {
  text: string;
}

/**
 * Build text associated with copying this range of columns from the data grid.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param headers the column names within this range.
 * @return text associated with copying this range from the data grid.
 */
export async function buildCopyColumns(dataId: string, headers: string[]): Promise<CopyRangeResponse | undefined> {
  return await GenericRepository.postDataToService<Record<string, string>, CopyRangeResponse>(
    `/dtale/build-column-copy/${dataId}`,
    { columns: JSON.stringify(headers) },
  );
}

/**
 * Build text associated with copying this range of rows from the data grid.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param headers the column names within this range.
 * @param params additional information about the rows being selected
 * @return text associated with copying this range from the data grid.
 */
export async function buildCopyRows(
  dataId: string,
  headers: string[],
  params: Record<string, string>,
): Promise<CopyRangeResponse | undefined> {
  return await GenericRepository.postDataToService<Record<string, string>, CopyRangeResponse>(
    `/dtale/build-row-copy/${dataId}`,
    { columns: JSON.stringify(headers), ...params },
  );
}
