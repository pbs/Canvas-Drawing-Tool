const BitmapBrush = require('./bitmap-brush');
const MaskedBrushRenderer = require('../masked-brush-renderer');

const BitmapEraserBrush = fabric.util.createClass(BitmapBrush, MaskedBrushRenderer, {
  /**
   * Override the color grabbing logic to always give white. This will make it appear like it's erasing over white
   * backgrounds. However, this doesn't handle background images well. But that's already a tracked issue
   */
  getRgbColor: function () {
    return [255, 255, 255];
  },

  /**
   * Override on mouse up for the bitmap brush to do the exact same thing, but composite differently so that it
   * actually erases from the lower canvas
   */
  onMouseUp: function () {
    var dataUrl = this.canvas.contextTop.canvas.toDataURL();
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
