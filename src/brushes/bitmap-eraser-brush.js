const BitmapBrush = require('./bitmap-brush');
const util = require('../util');

const BitmapEraserBrush = fabric.util.createClass(BitmapBrush, {
  initialize: function (canvas, options) {
    this.callSuper('initialize', canvas, options);

    this.maskCanvas = this._makeCanvas();
  },

  _makeCanvas: function () {
    var canvas = document.createElement('canvas');
    canvas.width = this.canvas.contextTop.canvas.width;
    canvas.height = this.canvas.contextTop.canvas.height;
    return canvas;
  },

  /**
   * Override the color grabbing logic to always give white. This will make it appear like it's
   * erasing over white backgrounds. However, this doesn't handle background images well. But that's
   * already a tracked issue
   * @return {Array} A array of bytes representing white
   */
  getRgbColor: function () {
    return [255, 255, 255];
  },

  stampImage: function (pointer) {
    if(!this.bitmap) {
      return;
    }

    var drawWidth = this.width * 2;
    var drawHeight = this.width / this.aspectRatio * 2;
    var x = pointer.x - drawWidth / 2;
    var y = pointer.y - drawHeight / 2;

    // stamp the bitmap on the mask
    this.maskCanvas.getContext('2d').drawImage(this.bitmap, x, y, drawWidth, drawHeight);

    this.canvas.contextTop.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    this.canvas.contextTop.globalCompositeOperation = 'source-over';
    this.canvas.contextTop.drawImage(
      util.precompositeBackground(this.canvas.wrapperEl.previousElementSibling), 0, 0);
    this.canvas.contextTop.globalCompositeOperation = 'destination-in';
    this.canvas.contextTop.drawImage(this.maskCanvas, 0, 0);
    this.canvas.contextTop.globalCompositeOperation = 'source-over';
  },

  /**
   * Override on mouse up for the bitmap brush to do the exact same thing, but composite differently
   * so that it actually erases from the lower canvas
   * @return {void}
   */
  onMouseUp: function () {
    var dataUrl = this.maskCanvas.toDataURL();
    fabric.Image.fromURL(dataUrl, function (image) {
      image.set({ selectable: false });
      image.globalCompositeOperation = 'destination-out';
      this.canvas.add(image);
      this.canvas.clearContext(this.canvas.contextTop);
      this.canvas.renderAll();
    }.bind(this));
  }
});

module.exports = BitmapEraserBrush;
