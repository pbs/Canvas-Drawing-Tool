/**
 * A mixin for making brushes erase from the canvas during their "live update" (onMouseMove)
 */
const MaskedBrushRenderer = {
  _render: function () {
    var ctx = this.canvas.contextTop;
    ctx.strokeStyle = 'white';
    this.callSuper('_render');
  }
};

module.exports = MaskedBrushRenderer;
