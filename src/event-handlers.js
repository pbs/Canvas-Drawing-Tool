const {fabric} = require('fabric');
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
    // once the sticker has been added, we'll create a new, identical sticker/stamp so the user
    // can continue placing stickers
    return this.setSticker(this.state.sticker._element.src);
  }

  // add the sticker
  this._canvas.add(this.state.sticker);

  const pointer = this._canvas.getPointer(evt.e);

  // position the sticker
  this.state.sticker.set({
    left: pointer.x,
    top: pointer.y
  });
  this.state.sticker.setCoords();

  if (this._config.stickerControls) {
    this.state.sticker.set({
      transparentCorners: false,
      cornerSize: this._config.stickerControls.cornerSize,
      cornerColor: this._config.stickerControls.cornerColor
    });
  }

  // make this the only active sticker
  this._canvas.setActiveObject(this.state.sticker);

  this._setState({ _stickerAdded: true });

  this._snapshotToHistory();
  return this.triggerRender();
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
