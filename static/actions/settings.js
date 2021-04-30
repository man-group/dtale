export function updateSettings(settings, callback) {
  return dispatch => {
    dispatch({ type: "update-settings", settings });
    callback?.();
  };
}
