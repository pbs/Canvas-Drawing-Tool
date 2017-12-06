const Stickerbook = require('../src/stickerbook');

const images = {
  star: 'data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7',
  dot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  box: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAAECAYAAACk7+45AAAAFElEQVQYV2NkYGD4z8DAwMCImwEASjQEAY/F9H0AAAAASUVORK5CYII='
};

const createValidConfig = () => {
  var div = document.createElement('div');
  div.id = 'test-container';
  document.body.appendChild(div);

  return {
    container: div,
    stickers: {
      enabled: [
        images.star,
        images.dot
      ],
      controls: {
        cornerColor: 'rgba(0, 0, 0, 0.5)',
        cornerSize: 20
      }
    },
    brush: {
      widths: [1, 10],
      enabled: ['eraser', 'bitmap', 'fill', 'marker', 'pencil', 'spray'],
      colors: ['#0000FF', '#FF0000'],
    },
    background: {
      enabled: [images.dot],
      default: null
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

module.exports = { images, createValidConfig, createStickerbook };
