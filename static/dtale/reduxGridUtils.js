import _ from "lodash";
import * as gu from "./gridUtils";

const toggleColumns = ({ columns }, columnsToToggle) => ({
  columns: columns.map(col => ({
    ...col,
    visible: columnsToToggle[col.name] ?? col.visible,
  })),
  triggerResize: true,
});

export function handleReduxState(state, props, propagateState) {
  const { dataViewerUpdate, clearDataViewerUpdate } = props;
  if (dataViewerUpdate) {
    switch (dataViewerUpdate.type) {
      case "toggle-columns":
        propagateState(toggleColumns(state, dataViewerUpdate.columns), clearDataViewerUpdate);
        break;
      case "update-state":
        propagateState(dataViewerUpdate.state, () => {
          if (dataViewerUpdate.callback) {
            dataViewerUpdate.callback();
          }
          clearDataViewerUpdate();
        });
        break;
      case "update-max-width":
        propagateState(
          {
            columns: _.map(state.columns, c => ({
              ...c,
              ...gu.calcColWidth(
                { ...c, resized: false },
                { ...state, ...props.settings, maxColumnWidth: dataViewerUpdate.width }
              ),
            })),
            triggerResize: true,
          },
          clearDataViewerUpdate
        );
        break;
    }
  }
}
