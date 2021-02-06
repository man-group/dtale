import _ from "lodash";

import { buildForwardURL } from "../reshape/Reshape";

export function jumpToDataset(dataId) {
  if (_.startsWith(window.location.pathname, "/dtale/popup/upload")) {
    if (window.opener) {
      window.opener.location.assign(buildForwardURL(window.opener.location.href, dataId));
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
