/**
 * Utility function to determine if a 'touch:drag' event is the last in a series,
 * corresponding to 'mouse:up'.
 * @param {Object} evt - touch event from fabric.Canvas
 *
 * @returns {Boolean} true if it is the last in a series, false otherwise
 */
const isLastInDragSeries = (evt) => {
  // a bit hacky and ad-hoc, there may be a better way to do this.
  return evt.e.cancelable === undefined;
};


/**
 * Utility function to determine if a Fabric path:created event corresponds
 * to a path we already have recorded
 * @param {Object} evt - 'path:created' event from fabric.Canvas
 * @param {Object[]} canvasHistory - internal history array from Stickerbook
 *
 * @returns {Boolean} true if we have recorded this path, false otherwise
 */
const isAlreadyRecordedPath = (evt, canvasHistory) => {
  if (canvasHistory.length === 0) {
    return false;
  }
  const endOfHistory = JSON.parse(canvasHistory[(canvasHistory.length - 1)]);
  const serializedPaths = endOfHistory.objects.map((obj) => {
    return JSON.stringify(obj);
  });
  const serializedNewPath = JSON.stringify(evt);

  for(var i = 0; i < serializedPaths.length; i++) {
    if(serializedPaths[i] === serializedNewPath) {
      return true;
    }
  }

  return false;
};

/**
 * Utility function to determine if a given event name is a valid fabric event
 *
 * @param {string} eventName - candidate event name
 *
 * @returns {Boolean} true if event name is a fabric event, false if not
 */
const isFabricEventName = (eventName) => {
  const fabricEvents = [
    'before:selection:cleared',
    'mouse:down',
    'mouse:move',
    'mouse:out',
    'mouse:over',
    'mouse:up',
    'object:modified',
    'object:moving',
    'object:rotating',
    'object:scaling',
    'object:selected',
    'path:created',
    'selection:cleared',
    'selection:created',
    'touch:drag',
    'touch:gesture',
    'touch:longpress',
    'touch:orientation',
    'touch:shake'
  ];

  return fabricEvents.indexOf(eventName) > -1;
};


module.exports = {
  isAlreadyRecordedPath: isAlreadyRecordedPath,
  isFabricEventName: isFabricEventName,
  isLastInDragSeries: isLastInDragSeries
};
