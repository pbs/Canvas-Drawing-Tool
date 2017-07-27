const {
  isAlreadyRecordedPath
} = require('./util');

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

const pathCreatedHandler = function (evt) {
  // NOTE: fabric seems to send duplicate path:created events when using
  // mouse events. We can filter out duplicates here.

  if (!isAlreadyRecordedPath(evt.path, this.history)) {
    this._snapshotToHistory();
  }
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

module.exports = {
  disableSelectabilityHandler: disableSelectabilityHandler,
  mouseDownHandler: mouseDownHandler,
  pathCreatedHandler: pathCreatedHandler
};
