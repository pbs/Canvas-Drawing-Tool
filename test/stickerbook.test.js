/* eslint-env mocha */
'use strict';

const expect = require('expect');
const sinon = require('sinon');

const Stickerbook = require('../src/stickerbook');
const historyFixture = require('./data/historyFixture.json');

const createValidConfig = () => {
  return {
    container: document.createElement('div'),
    stickers: [
      'http://www.example.com/images/A.png',
      'http://www.example.com/images/B.png',
      'http://www.example.com/images/C.png'
    ],
    brush: {
      widths: [1, 10],
      enabled: ['eraser', 'fill', 'marker', 'pencil', 'spray'],
      colors: ['#0000FF', '#FF0000'],
    },
    background: {
      enabled: ['http://www.example.com/images/A.png'],
      default: null
    },
    stickerControls: {
      cornerColor: 'rgba(0, 0, 0, 0.5)',
      cornerSize: 20
    },
    useDefaultEventHandlers: true,
    mobileEnabled: true
  };
};

const createStickerbook = () => {
  var stickerbook = new Stickerbook(createValidConfig());

  // fake the dimensions of each of the canvas elements
  stickerbook.backgroundManager._canvas.width = 100;
  stickerbook.backgroundManager._canvas.height = 100;
  stickerbook._canvas.lowerCanvasEl.width = 100;
  stickerbook._canvas.lowerCanvasEl.height = 100;

  return stickerbook;
};


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
      'http://www.example.com/images/A.png',
      'http://www.example.com/images/B.png',
      'http://www.example.com/images/C.png'
    ]);
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

  it('sets brush width', () => {
    const stickerbook = createStickerbook();
    stickerbook.setBrushWidth(1);
    expect(stickerbook.state.brushWidth).toEqual(1);
    stickerbook.setBrushWidth(10);
    expect(stickerbook.state.brushWidth).toEqual(10);
  });

  it('calls undo safely with no history', () => {
    const stickerbook = createStickerbook();

    expect(stickerbook.history.length).toEqual(0);
    expect(stickerbook.state.historyIndex).toEqual(null);

    return stickerbook
    .undo()
    .then((s) => {
      expect(s.history.length).toEqual(0);
      expect(s.state.historyIndex).toEqual(null);
      return true;
    });
  });

  it('calls redo safely with no history', () => {
    const stickerbook = createStickerbook();

    expect(stickerbook.history.length).toEqual(0);
    expect(stickerbook.state.historyIndex).toEqual(null);

    return stickerbook
    .redo()
    .then((s) => {
      expect(s.history.length).toEqual(0);
      expect(s.state.historyIndex).toEqual(null);
      return true;
    });
  });

  it('walks back through history', () => {
    const stickerbook = createStickerbook();
    // hack in a fake history, to elide the challenge of faking canvas events
    stickerbook.history = historyFixture;
    const clearSpy = sinon.spy(stickerbook._canvas, 'clear');

    expect(stickerbook.history.length).toEqual(6);
    expect(stickerbook.state.historyIndex).toEqual(null);

    return stickerbook.undo()
    .then((s) => {
      expect(s.history.length).toEqual(6);
      expect(s.state.historyIndex).toEqual(4);
      return stickerbook.undo();
    })
    .then((s) => {
      expect(s.history.length).toEqual(6);
      expect(s.state.historyIndex).toEqual(3);
      expect(clearSpy.callCount).toEqual(2);
      return stickerbook.undo();
    })
    .then((s) => {
      expect(s.history.length).toEqual(6);
      expect(s.state.historyIndex).toEqual(2);
      expect(clearSpy.callCount).toEqual(3);
      return stickerbook.undo();
    })
    .then((s) => {
      expect(s.history.length).toEqual(6);
      expect(s.state.historyIndex).toEqual(1);
      return stickerbook.undo();
    })
    .then((s) => {
      expect(s.history.length).toEqual(6);
      expect(s.state.historyIndex).toEqual(0);
      return stickerbook.undo();
    })
    .then((s) => {
      expect(s.history.length).toEqual(6);
      expect(s.state.historyIndex).toEqual(-1);
      return stickerbook.undo();
    })
    .then((s) => {
      expect(s.history.length).toEqual(6);
      expect(s.state.historyIndex).toEqual(-1);
      return true;
    });
  });

  it('walks back and forward through history', () => {
    const stickerbook = createStickerbook();
    stickerbook.history = historyFixture;
    expect(stickerbook.history.length).toEqual(6);
    expect(stickerbook.state.historyIndex).toEqual(null);

    return stickerbook.undo()
    .then((s) => {
      expect(s.history.length).toEqual(6);
      expect(s.state.historyIndex).toEqual(4);
      return stickerbook.undo();
    })
    .then((s) => {
      expect(s.history.length).toEqual(6);
      expect(s.state.historyIndex).toEqual(3);
      return stickerbook.redo();
    })
    .then((s) => {
      expect(s.history.length).toEqual(6);
      expect(s.state.historyIndex).toEqual(4);
      return stickerbook.redo();
    })
    .then((s) => {
      expect(s.history.length).toEqual(6);
      expect(s.state.historyIndex).toEqual(null);
      return true;
    });
  });

  it('serializes canvas state to an image', () => {
    const stickerbook = createStickerbook();
    const image = stickerbook.serializeToImage();
    expect(image).toExist();
  });

  it('sets an enabled background image', () => {
    const stickerbook = createStickerbook();
    expect(stickerbook.getBackground()).toNotEqual('http://www.example.com/images/A.png');
    stickerbook.setBackground('http://www.example.com/images/A.png');
    expect(stickerbook.getBackground()).toEqual('http://www.example.com/images/A.png');
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
    config.background.default = 'http://www.example.com/images/A.png';
    const stickerbook = new Stickerbook(config);
    expect(stickerbook.getBackground()).toEqual('http://www.example.com/images/A.png');
  });

  it('can remove an existing background image', () => {
    // set a background
    const stickerbook = createStickerbook();
    stickerbook.setBackground('http://www.example.com/images/A.png');

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

  it('destroys properly', () => {
    const stickerbook = createStickerbook();
    
    expect(stickerbook.isDestroyed).toEqual(false);
    expect(stickerbook.containerElement.childNodes.length).toNotEqual(0);

    stickerbook.destroy();

    expect(stickerbook.isDestroyed).toEqual(true);
    expect(stickerbook.containerElement.childNodes.length).toEqual(0);
  });
});
