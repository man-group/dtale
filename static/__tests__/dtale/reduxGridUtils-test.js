import { expect, it } from "@jest/globals";

import * as reduxUtils from "../../dtale/reduxGridUtils";

describe("reduxGridUtils", () => {
  let propagateState;

  beforeEach(() => {
    propagateState = jest.fn();
  });

  it("handles drop-columns", () => {
    const props = {
      dataViewerUpdate: { type: "drop-columns", columns: ["foo"] },
      clearDataViewerUpdate: jest.fn(),
    };
    const columns = [{ name: "foo" }, { name: "bar" }];
    reduxUtils.handleReduxState({ columns }, props, propagateState);
    expect(propagateState).toHaveBeenCalledWith(
      { columns: [{ name: "bar" }], triggerResize: true },
      props.clearDataViewerUpdate
    );
  });
});
