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
    }
  }
}
