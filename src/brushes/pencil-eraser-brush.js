const MaskedPath = require('../masked-path');
const util = require('../util');

/**
 * A pencil brush that erases from the canvas
 */
const PencilEraserBrush = fabric.util.createClass(fabric.PencilBrush, {
  /**
   * Overriding the base onMouseDown to fix a weird bug I was seeing: The first path didn't render
   * properly because `this.color` was not being set correctly on the first path. Here, I'm just
   * forcing it to be set properly.
   * @param {Object} pointer The mouse pointer
   * @return {void}
   */
  onMouseDown: function (pointer) {
    this._setBrushStyles();

    this.callSuper('onMouseDown', pointer);
  },

  /**
   * Override of the the base _setBrushStyles to override the brush color to a pattern that
   * overlays the background OVER the current canvas to appear as if it is erasing
   * @return {void}
   */
  _setBrushStyles: function () {
    this.callSuper('_setBrushStyles');

    // pre-calculate the background pattern
    var background = this.canvas.wrapperEl.previousElementSibling;
    var precomposited = util.precompositeBackground(background);
    this.color = this.canvas.contextTop.createPattern(precomposited, 'no-repeat');
  },

  /**
   * An override of the pencil brush's `createPath` method, to that it uses our
   * custom `MaskedPath`, rather than the default `fabric.Path`. This allows us
   * to customize the behavior of the final rendered path that was drawn. In this
   * case, we'll use compositing to make the path erase, rather than add to the
   * canvas.
   *
   * @param {String} pathData The path data to be rendered
   * @return {MaskedPath} The path that will be rendered
   */
  createPath: function (pathData) {
    return new MaskedPath(pathData, {
      fill: null,
      originX: 'center',
      originY: 'center',
      selectable: false,
      stroke: 'black',
      strokeDashArray: this.strokeDashArray,
      strokeLineCap: this.strokeLineCap,
      strokeLineJoin: this.strokeLineJoin,
      strokeWidth: this.width
    });
  }
});

module.exports = PencilEraserBrush;
