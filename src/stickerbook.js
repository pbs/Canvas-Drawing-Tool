const {fabric} = require('fabric');
const Ajv = require('ajv');
const validationRules = require('./validation-rules');
const {CircleBrush, PencilBrush, SprayBrush} = fabric;
const FillBrush = require('./fill-brush');
const BackgroundManager = require('./background-manager');
const MarkerBrush = require('./marker-brush');
const PatternBrush = require('./pattern-brush');
const PencilEraserBrush = require('./pencil-eraser-brush');
const Promise = window.Promise || require('bluebird');
const {
  disableSelectabilityHandler,
  mouseDownHandler,
  pathCreatedHandler
} = require('./event-handlers');
const { calculateInnerDimensions } = require('./util');

const BRUSHES = {
  circle: CircleBrush,
  eraser: PencilEraserBrush,
  marker: MarkerBrush,
  pattern: PatternBrush,
  pencil: PencilBrush,
  spray: SprayBrush,
  fill: FillBrush
};

class Stickerbook {
  /**
   * Construct new stickerbook
   * @param {Object} config - configuration options
   * @param {Object[]} config.stickers - urls to sticker PNG images
   * @param {string} config.container - DOM div element to manipulate
   *
   * @returns {Object} Stickerbook
   */
  constructor(config) {
    // assign default to the config, if it's missing
    const configWithDefaults = this._applyDefaultConfigs(config);

    this._validateConfig(configWithDefaults);

    this._config = configWithDefaults;

    this.state = {
      brush: configWithDefaults.brush.enabled[0],
      brushWidth: configWithDefaults.brush.widths[0],
      color: configWithDefaults.brush.colors[0],
      drawing: true,
      sticker: null,
      historyIndex: null
    };
    this.history = [];

    this.containerElement = configWithDefaults.container;

    // the background canvas
    this.backgroundManager = new BackgroundManager(this.containerElement);

    // fabric requires us to explicitly set and manage height and width.
    // (http://stackoverflow.com/questions/10581460)
    this._canvas = this._initializeFabricCanvas(this.containerElement);

    if (this._config.background && this._config.background.default) {
      this.setBackground(this._config.background.default);
    }

    this._updateCanvasState();

    // responsive logic
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);

    // mark destroyed state
    this.isDestroyed = false;

    return this;
  }

  /**
   * Applies defaults to a specified config
   * @param {Object} config The passed config object
   * @return {Object} An updated config object that has stickerbook config defaults set on it
   */
  _applyDefaultConfigs(config) {
    const background = Object.assign({
      enabled: [],
      default: null
    }, config.background);

    const defaults = {
      mobileEnabled: true,
      useDefaultEventHandlers: false
    };

    return Object.assign({}, defaults, config, { background });
  }

  /**
   * Initizalizes a configured Fabric.Canvas object within DOM containing element
   * @param {Object} containerElement - DOM element to build canvas within
   *
   * @returns {Object} Fabric.Canvas
   */
  _initializeFabricCanvas(containerElement) {
    const canvasElement = fabric.document.createElement('canvas');
    containerElement.appendChild(canvasElement);

    const dimensions = calculateInnerDimensions(containerElement);
    const canvas = new fabric.Canvas(
      canvasElement, {
        width: dimensions.width,
        height: dimensions.height,
        enableRetinaScaling: false,
        selection: false  // no group selection
      }
    );

    // we always want history, so wire up the pathCreatedHandler
    canvas.on('path:created', pathCreatedHandler.bind(this));

    // more opinionated handlers, these can be deactivated by implementors
    if (this._config.useDefaultEventHandlers) {
      canvas.on('mouse:down', mouseDownHandler.bind(this));
    }

    // listen for objects to be added, so we can disable things from being selectable
    canvas.on('object:added', disableSelectabilityHandler.bind(this));

    return canvas;
  }

  /**
   * Serializes canvas state to this.history
   *
   * @returns {Object} Stickerbook
   */
  _snapshotToHistory() {
    if (this.state.historyIndex !== null) {
      // delete everything after historyIndex
      this.history = this.history.slice(0, (this.state.historyIndex + 1));
      // back at the front of history
      this._setState({historyIndex: null});
    }
    const serialized = JSON.stringify(this._canvas);
    this.history.push(serialized);

    return this;
  }

  /**
   * Steps canvas back one step in history, if possible
   *
   * this method is asynchronous, because we need to give Fabric time to
   * re-render images
   *
   * @returns {Object} Promise, which resolves to the Stickerbook
   */
  undo() {
    const stickerbook = this;
    if (this.history.length === 0) {
      // nothing to do, return a resolved promise.
      return new Promise((resolve) => {
        resolve(stickerbook);
      });
    }

    let targetHistoryIndex;

    if (this.state.historyIndex === null) {
      targetHistoryIndex = this.history.length - 2;
    } else {
      targetHistoryIndex = this.state.historyIndex - 1;
    }

    if (targetHistoryIndex < 0) {
      // we're restoring to nothing

      return new Promise((resolve, reject) => {
        try {
          stickerbook._setState({historyIndex: -1});
          stickerbook._canvas.clear();
          resolve(stickerbook);
        } catch (e) {
          reject(e);
        }
      });
    } else {
      // we have the target snapshot in memory

      return new Promise((resolve, reject) => {
        const targetSnapshot = stickerbook.history[targetHistoryIndex];
        stickerbook._canvas.loadFromJSON(targetSnapshot, () => {
          try {
            stickerbook._setState({historyIndex: targetHistoryIndex});
            stickerbook.triggerRender();
            resolve(stickerbook);
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }

  /**
   * Steps canvas forward one step in history, if possible
   *
   * @returns {Object} Promise, which resolves to the Stickerbook
   */
  redo() {
    const stickerbook = this;
    if (stickerbook.history.length === 0 || stickerbook.state.historyIndex === null) {
      // nothing to do, return a resolved promise.
      return new Promise((resolve) => {
        resolve(stickerbook);
      });
    }

    let targetHistoryIndex;
    let targetSnapshot;

    if (stickerbook.history.length === stickerbook.state.historyIndex + 2) {
      // we are resetting to the front of history, targetHistoryIndex goes back
      // to null
      targetHistoryIndex = null;
      targetSnapshot = stickerbook.history[stickerbook.history.length - 1];
    } else {
      targetHistoryIndex = stickerbook.state.historyIndex + 1;
      targetSnapshot = stickerbook.history[targetHistoryIndex];
    }

    return new Promise((resolve, reject) => {
      stickerbook._canvas.loadFromJSON(targetSnapshot, () => {
        try {
          stickerbook._setState({historyIndex: targetHistoryIndex});
          stickerbook.triggerRender();
          resolve(stickerbook);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  /**
   * Convenience function to update internal state and trigger update to external
   * canvas object state
   * @param {Object} newState - Stickerbook.state keys/values to update
   *
   * @returns {Object} Stickerbook
   */
  _setState(newState) {
    this.state = Object.assign(this.state, newState);
    this._updateCanvasState();
  }

  /**
   * Updates fabric Canvas to match internal `state`
   *
   * @returns {Object} Stickerbook
   */
  _updateCanvasState() {
    const BrushClass = BRUSHES[this.state.brush];
    const newBrushType = (
      this._canvas.freeDrawingBrush.constructor.prototype !== BrushClass.prototype
    );

    if (newBrushType) {
      const brush = new BrushClass(this._canvas);
      this._canvas.freeDrawingBrush = brush;
      if (this.state.brush === 'pattern') {
        brush.setImages(this.state.patternImages);
      }
    }

    this._canvas.freeDrawingBrush.color = this.state.color;
    this._canvas.freeDrawingBrush.width = this.state.brushWidth;
    this._canvas.isDrawingMode = this.state.drawing;

    // set background image on container
    this.backgroundManager.setImageSrc(this.state.backgroundImage);
    this.backgroundManager.render();

    return this;
  }

  /**
   * Mutates canvas and contained objects in response to resize event
   * @param {Object} evt - window.resize event
   *
   * @returns {Object} Stickerbook
   */
  resize() {
    // theoretically, fabric supports setting CSS dimensions directly
    // (http://fabricjs.com/docs/fabric.Canvas.html#setDimensions)
    // however, using that mechanism seems to result in undesireable
    // scaling behavior: https://github.com/kangax/fabric.js/issues/1270

    const originalDimensions = {
      width: this._canvas.width,
      height: this._canvas.height
    };

    const newDimensions = calculateInnerDimensions(this.containerElement);

    this._repositionObjects(originalDimensions, newDimensions);

    this.backgroundManager.resize();
    this._canvas.setDimensions(newDimensions);

    return this;
  }

  _repositionObjects(originalDimensions, newDimensions) {
    var scaleFactor = newDimensions.width / originalDimensions.width;

    this._canvas.getObjects().forEach((object) => {
      object.setScaleX(object.getScaleX() * scaleFactor);
      object.setScaleY(object.getScaleY() * scaleFactor);
      object.setLeft(object.getLeft() * scaleFactor);
      object.setTop(object.getTop() * scaleFactor);
    });
  }

  /**
   * Validate config object.
   * @param {Object} config - configuration options
   *
   * @returns {Boolean} true if confguration is valid
   */
  _validateConfig(config) {
    const validator = new Ajv();
    const valid = validator.validate(validationRules, config);
    if(valid) {
      return true;
    }

    const formattedErrors = validator.errors.map((error) => {
      const field = error.dataPath.replace(/^\./, '');
      return field + ' ' + error.message;
    });

    throw new Error(formattedErrors.join(' '));
  }

  /**
   * Set active brush for painting.
   * @param {string} brushName - name of the brush to set active
   * @param {Object} brushConfig - name of the brush to set active
   * @param {Object.string} brushConfig.patternUrl - name of the brush to set active
   *
   * @returns {Object} Stickerbook
   */
  setBrush(brushName, brushConfig) {
    if (this._config.brush.enabled.indexOf(brushName) === -1) {
      throw new Error(brushName + ' is not a permitted brush');
    }

    if (Object.keys(BRUSHES).indexOf(brushName) === -1) {
      throw new Error(brushName + ' is an unknown brush type');
    }

    let newState = {
      brush: brushName,
      drawing: true
    };

    if (brushName === 'pattern') {
      if (!brushConfig || Object.keys(brushConfig).indexOf('images') === -1) {
        throw new Error('images configuration required for pattern brush');
      }
      newState.patternImages = brushConfig.images;
    }

    return this._setState(newState);
  }

  /**
   * Set active brush width for painting.
   * @param {number} pixels - width in pixels for the brush
   *
   * @returns {Object} Stickerbook
   */
  setBrushWidth(pixels) {
    if (this._config.brush.widths.indexOf(pixels) === -1) {
      throw new Error(pixels + ' is not a permitted brush width');
    }

    return this._setState({
      brushWidth: pixels,
      drawing: true
    });
  }

  /**
   * Set active color for painting.
   * @param {string} color - hex code of color
   *
   * @returns {Object} Stickerbook
   */
  setColor(color) {
    if (this._config.brush.colors.indexOf(color) === -1) {
      throw new Error(color + ' is not a permitted color');
    }

    return this._setState({
      color: color,
      drawing: true
    });
  }

  /**
   * Set sticker for placing.
   * @param {string} stickerUrl - URL of image for sticker use
   *
   * @returns {Object} Stickerbook
   */
  setSticker(stickerUrl) {
    if (this._config.stickers.indexOf(stickerUrl) === -1) {
      throw new Error(stickerUrl + ' is not a permitted sticker');
    }

    // async, unfortunately - maybe a problem
    fabric.Image.fromURL(stickerUrl, (img) => {
      this._setState({
        sticker: img,
        drawing: false,
        _stickerAdded: false
      });
    });

    return this;
  }

  setPan() {
    throw new Error('not yet implemented: Stickerbook.setPan()');
  }

  setZoom() {
    throw new Error('not yet implemented: Stickerbook.setZoom()');
  }

  clear() {
    this._canvas.clear();
    this._snapshotToHistory();
  }

  /**
   * Get a list of all available colors, as hex codes
   *
   * @returns {Object[]} array of hex code strings
   */
  getAvailableColors() {
    return this._config.brush.colors;
  }

  /**
   * Get a list of all available sticker images, as urls
   *
   * @returns {Object[]} array of sticker image urls
   */
  getAvailableStickers() {
    return this._config.stickers;
  }

  /**
   * Set background image of canvas
   * @param {string|null} imageUrl - url to image for background, or null to remove
   * the background
   *
   * @returns {Object} stickerbook
   */
  setBackground(imageUrl) {
    if(!imageUrl) {
      this.clearBackground();
      return this;
    }

    if(!this._config.background || !(this._config.background.enabled instanceof Array)) {
      return this;
    }

    var backgroundImageIsEnabled = this._config.background.enabled.indexOf(imageUrl) > -1;

    if(!backgroundImageIsEnabled) {
      throw new Error(`${imageUrl} is not a permitted background`);
    }

    this._setState({
      backgroundImage: imageUrl
    });

    return this;
  }

  /**
   * Removes any background image for the stickerbook
   *
   * @return {Object} stickerbook
   */
  clearBackground() {
    this._setState({
      backgroundImage: null
    });

    return this;
  }

  /**
   * Get background image of canvas
   *
   * @returns {string} url for background image
   */
  getBackground() {
    return this.state.backgroundImage;
  }

  /**
   * Exports the stickerbook to a base64 encoded PNG, mimicking the native canvas methods
   *
   * @returns {string} A base64 string with the composited image in it
   */
  toDataURL() {
    var dummyCanvas = document.createElement('canvas');
    dummyCanvas.width = this._canvas.lowerCanvasEl.width;
    dummyCanvas.height = this._canvas.lowerCanvasEl.height;
    var dummyContext = dummyCanvas.getContext('2d');

    dummyContext.drawImage(this.backgroundManager._canvas, 0, 0);
    dummyContext.drawImage(this._canvas.lowerCanvasEl, 0, 0);

    return dummyCanvas.toDataURL();
  }

  /**
   * Register a callback on an event
   *
   * @param {string} eventName - name of event to listen for
   * @param {function} handler - callback for event listener
   *
   * @return {Object} stickerbook
   */
  on(eventName, handler) {
    this._canvas.on(eventName, handler);
    return this;
  }

  /**
   * Deregister a callback on an event
   *
   * @param {string} eventName - name of event
   * @param {function} handler - callback to remove
   *
   * @return {Object} stickerbook
   */
  off(eventName, handler) {
    this._canvas.off(eventName, handler);
    return this;
  }

  /**
   * Get topmost sticker (usually the most recently added)
   *
   * @return {Object|null} either the topmost sticker object, or null if there
   * are no stickers
   */
  getTopSticker() {
    const objects = this._canvas.getObjects();
    // fabric appends to its objects, so the top object is the furthest to
    // the right
    for(var i = objects.length - 1; i >= 0; i--) {
      if(objects[i]._element !== undefined) {
        return objects[i];
      }
    }
    return null;
  }

  /**
   * Trigger a canvas render cycle
   * This is useful for low-level manipulation of objects
   *
   * @return {Object} stickerbook
   */
  triggerRender() {
    this._canvas.renderAll();
    return this;
  }

  /**
   * Destroys the stickerbook, removing global event listeners and dom elements created by the
   * sticker book
   * @return {undefined}
   */
  destroy() {
    window.removeEventListener('resize', this.resize);
    this._canvas.dispose();
    delete this._canvas;
    delete this.backgroundManager;
    while(this.containerElement.firstChild) {
      this.containerElement.removeChild(this.containerElement.firstChild);
    }
    this.isDestroyed = true;
  }
}

module.exports = Stickerbook;
