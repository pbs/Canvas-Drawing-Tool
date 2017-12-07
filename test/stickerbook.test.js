/* eslint-env mocha */
'use strict';

const expect = require('expect');
const sinon = require('sinon');

const Stickerbook = require('../src/stickerbook');

const { images, createValidConfig, createStickerbook } = require('./helpers.js');

describe('Stickerbook', () => {
  it('does not present config as part of public API', () => {
    const stickerbook = createStickerbook();
    expect(stickerbook.config).toNotExist();
  });

  it('accepts valid configuration', () => {
    const validConfig = createValidConfig();
    const stickerbook = new Stickerbook(validConfig);
    expect(stickerbook._config).toEqual(validConfig);
  });

  it('allows custom brushes', () => {
    const validConfig = createValidConfig();
    validConfig.brush.custom = {
      circle: fabric.CircleBrush
    };
    validConfig.brush.enabled.push('circle');
    const stickerbook = new Stickerbook(validConfig);
    stickerbook.setBrush('circle');
  });

  it('fails on custom brushes that aren\'t subclasses of base brush', () => {
    const config = createValidConfig();
    config.brush.custom = {
      circle: function() { }
    };
    expect(
      () => new Stickerbook(config)
    ).toThrow('Custom brush "circle" is not an instance of fabric.BaseBrush');
  });

  it('sets colors', () => {
    const stickerbook = createStickerbook();
    stickerbook.setColor('#0000FF');
    expect(stickerbook.state.color).toEqual('#0000FF');
    stickerbook.setColor('#FF0000');
    expect(stickerbook.state.color).toEqual('#FF0000');
  });

  it('returns available colors', () => {
    const stickerbook = createStickerbook();
    const colors = stickerbook.getAvailableColors();
    expect(colors).toEqual(['#0000FF', '#FF0000']);
  });

  it('returns available stickers', () => {
    const stickerbook = createStickerbook();
    const stickers = stickerbook.getAvailableStickers();
    expect(stickers).toEqual([
      images.star,
      images.dot
    ]);
  });

  it('sets a sticker', done => {
    const stickerbook = createStickerbook();
    stickerbook.setSticker(images.dot)
      .then(function() {
        if(stickerbook.state.sticker !== null) {
          return done();
        }

        done('Sticker not set properly');
      })
  });

  it('sets brushes', () => {
    const stickerbook = createStickerbook();
    stickerbook.setBrush('pencil');
    expect(stickerbook.state.brush).toEqual('pencil');
    stickerbook.setBrush('spray');
    expect(stickerbook.state.brush).toEqual('spray');
    stickerbook.setBrush('marker');
    expect(stickerbook.state.brush).toEqual('marker');
    stickerbook.setBrush('eraser');
    expect(stickerbook.state.brush).toEqual('eraser');
    stickerbook.setBrush('fill');
    expect(stickerbook.state.brush).toEqual('fill');
  });

  it('updates the brush when the configuration for a brush changes', () => {
    const stickerbook = createStickerbook();
    stickerbook.setBrush('bitmap', { image: images.dot });
    var oldBrush = stickerbook._canvas.freeDrawingBrush;
    stickerbook.setBrush('bitmap', { image: images.star });
    expect(stickerbook._canvas.freeDrawingBrush).toNotBe(oldBrush);
  });

  it('correctly detects the aspect ratio of the image, rather assuming a square image', (done) => {
    const stickerbook = createStickerbook();
    stickerbook.setBrush('bitmap', { image: images.box });

    // wait for the image to decode (shouldn't take long)
    setTimeout(() => {
      var actualAspectRatio = stickerbook._canvas.freeDrawingBrush.aspectRatio;

      // should be close to 0.5
      if(Math.abs(actualAspectRatio - 0.5) < 0.001) {
        done();
      } else {
        done(new Error(`Expected aspect ratio of 0.5, got ${actualAspectRatio}`));
      }
    }, 10);
  });

  it('sets brush width', () => {
    const stickerbook = createStickerbook();
    stickerbook.setBrushWidth(1);
    expect(stickerbook.state.brushWidth).toEqual(1);
    stickerbook.setBrushWidth(10);
    expect(stickerbook.state.brushWidth).toEqual(10);
  });

  it('serializes canvas state to an image', () => {
    const stickerbook = createStickerbook();
    const image = stickerbook.toDataURL();
    expect(image).toExist();
  });

  it('sets an enabled background image', () => {
    const stickerbook = createStickerbook();
    expect(stickerbook.getBackground()).toNotEqual(images.dot);
    stickerbook.setBackground(images.dot);
    expect(stickerbook.getBackground()).toEqual(images.dot);
  });

  it('does not set a non-enabled background image', () => {
    const stickerbook = createStickerbook();
    // .bind() semantics because of http://stackoverflow.com/a/21587239
    expect(
      stickerbook.setBackground.bind(stickerbook, 'http://www.example.com/images/B.png')
    ).toThrow('http://www.example.com/images/B.png is not a permitted background');
  });

  it('sets a default background image', () => {
    let config = createValidConfig();
    config.background.default = images.dot;
    const stickerbook = new Stickerbook(config);
    expect(stickerbook.getBackground()).toEqual(images.dot);
  });

  it('can remove an existing background image', () => {
    // set a background
    const stickerbook = createStickerbook();
    stickerbook.setBackground(images.dot);

    stickerbook.setBackground(null);
    expect(stickerbook.getBackground()).toEqual(null);
  });

  it('clears the canvas', () => {
    const stickerbook = createStickerbook();
    stickerbook.clear();
  });

  it('can export to a string', () => {
    const stickerbook = createStickerbook();
    var base64 = stickerbook.toDataURL();
    expect(typeof base64).toEqual('string');
    expect(base64.length).toNotEqual(0);
  });

  it('accepts custom callbacks', () => {
    const stickerbook = createStickerbook();
    const callback = function (evt) {
      console.log(evt);
    };
    stickerbook.on('mouse:down', callback);
  });

  it('removes custom callbacks', () => {
    const stickerbook = createStickerbook();
    const callback = function (evt) {
      console.log(evt);
    };
    stickerbook.on('mouse:down', callback);
    stickerbook.off('mouse:down', callback);
  });

  it('cannot place a sticker without a position', (done) => {
    const stickerbook = createStickerbook();

    stickerbook.setSticker(images.star)
      .then(() => {
        var errorMessage = null;
        try {
          stickerbook.placeSticker({});
        } catch(e) {
          errorMessage = e.message;
        }

        if(errorMessage == 'To place a sticker an x and y must be provided if there is no default') {
          return done();
        }

        done(new Error(`Expected correct error message, got "${errorMessage}" instead`));
      })
  })
  
  it('can place a sticker with a position', (done) => {
    const stickerbook = createStickerbook();

    stickerbook.setSticker(images.dot)
      .then(() => {
        stickerbook.placeSticker({ x: 0, y: 0 });
        done();
      })
      .catch(done);
  })

  it('destroys properly', () => {
    const stickerbook = createStickerbook();
    
    expect(stickerbook.isDestroyed).toEqual(false);
    expect(stickerbook.containerElement.childNodes.length).toNotEqual(0);

    stickerbook.destroy();

    expect(stickerbook.isDestroyed).toEqual(true);
    expect(stickerbook.containerElement.childNodes.length).toEqual(0);
  });

  require('./history.test.js');
  require('./event-handlers.test.js');
  require('./util.test.js');
});
