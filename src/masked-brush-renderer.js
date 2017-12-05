/**
 * A mixin for making brushes erase from the canvas during their "live update" (onMouseMove)
 */
const MaskedBrushRenderer = {
  _render: function () {
    var background = this.canvas.wrapperEl.previousElementSibling;
    var backgroundPattern = this.canvas.contextTop.createPattern(background, 'no-repeat');

    this.canvas.contextTop.strokeStyle = backgroundPattern;

    this.callSuper('_render');
  }
};

module.exports = MaskedBrushRenderer;
