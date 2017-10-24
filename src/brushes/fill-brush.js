const {ImageDataColorGrid, FuzzySelector} = require('fuzzy-select');

/**
 * A "paint bucket"-style tool that performs flood fill on regions with similar color
 */
const FillBrush = fabric.util.createClass(fabric.BaseBrush, {
  /**
   * Main constructor
   * @param {fabric.Canvas} canvas The canvas object to write to with this brush
   * @param {Object} options An options object
   * @param {Boolean} options.isAsync Whether or not the fill tool should be asynchronous or not
   *                                  (defaults to false)
   * @return {undefined}
   */
  initialize: function (canvas, options) {
    this.canvas = canvas;
    this.options = options;
    
    this.regionCells = [];
    this.keepPainting = false;
  },

  /**
   * Handler for mouse down on the canvas. Takes the current pointer location, runs the fuzzy
   * selection algorithm, and then fills the upper canvas in the appropriate location (with the
   * appropriate color)
   * @param {Object} pointer The xy location that was clicked/tapped
   * @return {undefined}
   */
  onMouseDown: function (pointer) {
    // Get the selected region
    var lowerContext = this.canvas.lowerCanvasEl.getContext('2d');
    var imageData = lowerContext.getImageData(0, 0, this.canvas.width, this.canvas.height);
    var colorGrid = new ImageDataColorGrid(imageData);
    var selector = new FuzzySelector(colorGrid);

    if(!this.options.isAsync) {
      this.selectedRegion = selector.select(Math.round(pointer.x), Math.round(pointer.y), 10);
      this.drawRange(this.selectedRegion);
    } else {
      var generator = selector.selectIteratively(Math.round(pointer.x), Math.round(pointer.y), 10);
      this.keepPainting = true;
      let doSteps = () => {
        if(!this.keepPainting) {
          return;
        }

        let i = 0, current = { done: false, value: undefined };
        while(i < this.options.stepsPerFrame && !current.done) {
          current = generator.next();
          i++;
        }

        this.drawRange(current.value);

        if(!current.done && this.keepPainting) {
          requestAnimationFrame(doSteps);
        }
      };

      requestAnimationFrame(doSteps);
    }
  },

  /**
   * Placeholder method for mouse move. Brushes need this method to function properly
   * @return {undefined}
   */
  onMouseMove: function () {
  },

  /**
   * Handler for mouse up that serializes the filled region
   * @return {undefined}
   */
  onMouseUp: function () {
    this.keepPainting = false;

    var dataUrl = this.canvas.contextTop.canvas.toDataURL();
    fabric.Image.fromURL(dataUrl, (image) => {
      image.set({ selectable: false });
      this.canvas.add(image);
      this.canvas.clearContext(this.canvas.contextTop);
      this.canvas.renderAll();
    });
  },

  /**
   * Draws a currently selected region to the canvas by drawing each individual scan line
   * @param {RangeSet} selectedRegion The selected region to draw
   * @returns {void}
   */
  drawRange: function(selectedRegion) {
    var ctx = this.canvas.contextTop;
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    selectedRegion.forEachRange(function (x, yRange) {
      ctx.moveTo(x, yRange.min);
      ctx.lineTo(x, yRange.max + 1);
    });
    ctx.lineWidth = 2;
    ctx.stroke();
  }
});

module.exports = FillBrush;
