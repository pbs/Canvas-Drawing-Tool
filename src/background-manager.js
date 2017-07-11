const { calculateInnerDimensions } = require('./util');

/**
 * Class for managing background image rendering
 */
class BackgroundManager {
  /**
   * Main constructor, sets up the canvas area for rendering
   * @param {Node} containerElement The container element for the canvas drawing tool
   */
  constructor(containerElement) {
    this._container = containerElement;
    // Create the canvas element
    this._canvas = document.createElement('canvas');
    this._context = this._canvas.getContext('2d');
    this._canvas.style.position = 'absolute';
    this._container.appendChild(this._canvas);

    // Create a flag for capturing if this is the first render, along with some
    // variables to capture the first calculated positioning values, so we can
    // reuse those for "no-rescale" positioning types
    this.isFirstRender = true;
    this.firstRenderTop = null;
    this.firstRenderLeft = null;
    this.firstRenderWidth = null;
    this.firstRenderHeight = null;

    this.positioning = 'default';

    this.resize();
  }

  /**
   * Resizes the background canvas based on the current size of the container
   * @return {undefined}
   */
  resize() {
    var dimensions = calculateInnerDimensions(this._container);
    this._canvas.width = dimensions.width;
    this._canvas.height = dimensions.height;
    this.render();
  }

  /**
   * Renders the passed background image
   * @param {String} imageSrc The url to the image to render
   * @return {undefined}
   */
  render() {
    // If no image source was provided, clear and do nothing
    if(!this.imageSrc) {
      this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
      return;
    }

    // If we've set a background, but it hasn't loaded yet, let the listener know that it wants to
    // render
    if(!this.imageLoaded) {
      return;
    }

    // We've got a loaded background, let's mark that we don't need to render anymore, and actually
    // draw the image
    var aspectRatio = this.backgroundImage.width / this.backgroundImage.height;
    var left = 0;
    var top = 0;
    var width = this.backgroundImage.width;
    var height = this.backgroundImage.height;

    if(this.positioning.indexOf('fit-height') > -1) {
      height = this._canvas.height;
      width = height * aspectRatio;
      top = 0;
      left = (this._canvas.width - width) / 2;
    } else if(this.positioning.indexOf('fit-width') > -1) {
      width = this._canvas.width;
      height = width / aspectRatio;
      left = 0;
      top = (this._canvas.height - height) / 2;
    }

    // If this is the first render, save our positioning values so we can reuse
    // them later (for no-rescale positioning types)
    if(this.isFirstRender) {
      this.firstRenderTop = top;
      this.firstRenderLeft = left;
      this.firstRenderWidth = width;
      this.firstRenderHeight = height;
    }

    // If this is a no-rescale type of positioning, use the original positioning
    // values, rather than the newly calculated ones
    if(this.positioning.indexOf('no-rescale') > -1 && !this.isFirstRender) {
      top = this.firstRenderTop;
      left = this.firstRenderLeft;
      width = this.firstRenderWidth;
      height = this.firstRenderHeight;
    }

    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.drawImage(this.backgroundImage, left, top, width, height);

    // Now that we've rendered, if this is a fit-once style, we don't need to rerender
    this.isFirstRender = false;
  }

  /**
   * Sets the image source to use for the background
   * @param {String} imageSrc The url to the image
   * @return {undefined}
   */
  setImageSrc(imageSrc) {
    // Set the main property
    this.imageSrc = imageSrc;
    if(!this.imageSrc) {
      return;
    }

    // If an image was provided, setup an image tag and render (if needed), when it loads
    this.imageLoaded = false;
    this.backgroundImage = new Image();
    this.backgroundImage.addEventListener('load', this.onBackgroundLoaded.bind(this));
    this.backgroundImage.src = imageSrc;
  }

  /**
   * Sets the positioning to use when rendering
   * @param {String} positioning The type of positioning to use:
   *  "fit-<width|height>[-no-rescale]" or "default"
   * @return {undefined}
   */
  setPositioning(positioning) {
    this.positioning = positioning;
    this.isFirstRender = true;
    this.render();
  }

  /**
   * Handler for when a background image loads. Triggers a render if one was requested while we were
   * waiting for the image to load
   *
   * @return {undefined}
   */
  onBackgroundLoaded() {
    this.imageLoaded = true;
    this.render();
  }
}

module.exports = BackgroundManager;
