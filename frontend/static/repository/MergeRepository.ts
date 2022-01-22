import { InstancesState } from '../redux/actions/MergeActions';
import { Dataset, MergeConfig, MergeConfigType, StackConfig } from '../redux/state/MergeState';

import * as GenericRepository from './GenericRepository';

/**
 * Load instances available for merging.
 *
 * @return instances available for merging.
 */
export async function loadInstances(): Promise<InstancesState | undefined> {
  return await GenericRepository.getDataFromService<InstancesState>('/dtale/processes?dtypes=true');
}

const extractDatasetParams = (datasets: Dataset[]): string => {
  return JSON.stringify(
    datasets.map((dataset) => ({
      columns: dataset.columns.map((col) => col.name),
      index: dataset.index.map((index) => index.name),
      dataId: dataset.dataId,
      suffix: dataset.suffix,
    })),
  );
};

/** Response object when posting a merge config */
interface MergeResponse extends GenericRepository.BaseResponse {
  data_id: number;
}

/**
 * Save merge config and build data.
 *
 * @param action the merge type to execute (merge or stack).
 * @param config the configuration of the merge type.
 * @param datasets the datasets to merge.
 * @param name the name to assign to the new instance.
 * @return the identifier of the newly merged data.
 */
export async function saveMerge(
  action: MergeConfigType,
  config: MergeConfig | StackConfig,
  datasets: Dataset[],
  name: string,
): Promise<MergeResponse | undefined> {
  return await GenericRepository.postDataToService<Record<string, string>, MergeResponse>('/dtale/merge', {
    action,
    config: JSON.stringify(config),
    datasets: extractDatasetParams(datasets),
    name,
  });
}
