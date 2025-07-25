import { getLocation, getOpenerLocation } from '../../location';
import { buildForwardURL } from '../reshape/utils';

export const jumpToDataset = async (
  dataId: string,
  mergeRefresher?: () => Promise<void>,
  isMerge = false,
): Promise<void> => {
  if (getLocation().pathname.startsWith('/dtale/popup/merge')) {
    if (isMerge) {
      getLocation().assign(buildForwardURL(getOpenerLocation().href, dataId));
    } else {
      await mergeRefresher?.();
    }
    return;
  } else if (
    getLocation().pathname.startsWith('/dtale/popup/upload') ||
    getLocation().pathname.startsWith('/dtale/popup/arcticdb')
  ) {
    if (window.opener) {
      if (getOpenerLocation().pathname.startsWith('/dtale/popup/merge')) {
        getOpenerLocation().assign('/dtale/popup/merge');
      } else {
        getOpenerLocation().assign(buildForwardURL(getOpenerLocation().href, dataId));
      }
      window.close();
    } else {
      // when we've started D-Tale with no data
      getLocation().assign(getLocation().origin);
    }
    return;
  }
  getLocation().assign(buildForwardURL(getLocation().href, dataId));
};
