import { buildForwardURL } from '../reshape/utils';

export const jumpToDataset = async (
  dataId: string,
  mergeRefresher?: () => Promise<void>,
  isMerge = false,
): Promise<void> => {
  if (window.location.pathname.startsWith('/dtale/popup/merge')) {
    if (isMerge) {
      window.location.assign(buildForwardURL(window.opener.location.href, dataId));
    } else {
      await mergeRefresher?.();
    }
    return;
  } else if (
    window.location.pathname.startsWith('/dtale/popup/upload') ||
    window.location.pathname.startsWith('/dtale/popup/arcticdb')
  ) {
    if (window.opener) {
      if (window.opener.location.pathname.startsWith('/dtale/popup/merge')) {
        window.opener.location.assign('/dtale/popup/merge');
      } else {
        window.opener.location.assign(buildForwardURL(window.opener.location.href, dataId));
      }
      window.close();
    } else {
      // when we've started D-Tale with no data
      window.location.assign(window.location.origin);
    }
    return;
  }
  window.location.assign(buildForwardURL(window.location.href, dataId));
};
