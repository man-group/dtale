import _ from "lodash";

import { buildForwardURL } from "../reshape/Reshape";

export function jumpToDataset(dataId, mergeRefresher, isMerge = false) {
  if (_.startsWith(window.location.pathname, "/dtale/popup/merge")) {
    if (isMerge) {
      window.location.assign(buildForwardURL(window.opener.location.href, dataId));
    } else {
      mergeRefresher();
    }
    return;
  } else if (_.startsWith(window.location.pathname, "/dtale/popup/upload")) {
    if (window.opener) {
      if (_.startsWith(window.opener.location.pathname, "/dtale/popup/merge")) {
        window.opener.location.assign("/dtale/popup/merge");
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

  const newLoc = buildForwardURL(window.location.href, dataId);
  window.location.assign(newLoc);
}
