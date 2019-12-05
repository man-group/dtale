import _ from "lodash";

function onResizeStart(context) {
  context.setState({
    resizedHeights: _.concat([0], context.state.resizedHeights),
  });
}

function onResize(context, height) {
  const { resizedHeights } = context.state;
  resizedHeights[0] = height;
  context.setState({ resizedHeights });
}

function onResizeStop(context) {
  context.setState({ resizedHeights: [_.sum(context.state.resizedHeights)] });
}

function actionBinder(context) {
  context.onResizeStart = () => onResizeStart(context);
  context.onResize = (_e, _direction, _ref, d) => onResize(context, d.height);
  context.onResizeStop = () => onResizeStop(context);
  context.onResizeStart = context.onResizeStart.bind(context);
  context.onResize = context.onResize.bind(context);
  context.onResizeStop = context.onResizeStop.bind(context);
}

export default { actionBinder, onResizeStart, onResize, onResizeStop };
