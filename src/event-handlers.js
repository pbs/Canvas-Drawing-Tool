const mouseDownHandler = function (evt) {
  if (this.state.drawing || this.state.sticker === null) {
    return this;
  }

  // Don't add the next sticker until we placed the current one
  if(this.state._stickerAdded && this.state.sticker.active) {
    return this;
  }

  if(this.state._stickerAdded) {
    return this;
  }

  return this.placeSticker(this._canvas.getPointer(evt.e));
};

const disableSelectabilityHandler = function (evt) {
  if (evt.target instanceof fabric.Image) {
    return;
  }

  // if the object isn't an image, then it'll be freehand drawing of some sort. Make that item not
  // selectable
  evt.target.selectable = false;
  evt.target.hasControls = false;
  evt.target.hasBorders = false;
  evt.target.active = false;
  this.triggerRender();
};

const recordObjectAddition = function(historyManager, fabricEvent) {
  // During a redo, the HistoryManager will automatically perform the canvas.add for us. We don't
  // want to track history for this addition if it's a redo, because it'll cause duplicates in the
  // stack
  var serializedTarget = JSON.stringify(fabricEvent.target);
  var objectAlreadyInHistory = historyManager.history
    .reduce((a, b) => a.concat(b), []) // flatten the array
    .filter(historyEvent => historyEvent.type === 'add') // only get add events
    .some(historyEvent => historyEvent.data === serializedTarget) // see if the target is already there

  if(objectAlreadyInHistory) {
    return;
  }

  historyManager.pushNewFabricObject(fabricEvent.target);
};

const recordPropertyChange = function(historyManager, fabricEvent) {
  const propertiesWeCareAbout = ['scaleX', 'scaleY', 'globalCompositeOperation', 'angle', 'left', 'top'];

  const displayListIndex = historyManager.canvas.getObjects().indexOf(fabricEvent.target);
  const flattenedHistory = historyManager.history.reduce((a, b) => a.concat(b), []);
  const index = flattenedHistory.map(historyEvent => historyEvent.objectId).indexOf(fabricEvent.target.stickerbookObjectId);
  const serializedValue = flattenedHistory[index].data;
  const unserializedValue = JSON.parse(serializedValue);

  let propertyDeltas = [];
  propertiesWeCareAbout.forEach(function(property) {
    if(unserializedValue[property] !== fabricEvent.target[property]) {
      propertyDeltas.push({
        property: property,
        objectIndex: displayListIndex,
        oldValue: unserializedValue[property],
        newValue: fabricEvent.target[property]
      });
    }
  });
  historyManager.pushPropertyChanges(propertyDeltas);
};

module.exports = {
  disableSelectabilityHandler: disableSelectabilityHandler,
  mouseDownHandler: mouseDownHandler,
  recordObjectAddition: recordObjectAddition,
  recordPropertyChange: recordPropertyChange
};
