// utility forEach method, because nodeLists don't implement forEach
// in every browser. Based on
// https://toddmotto.com/ditch-the-array-foreach-call-nodelist-hack/#recommendations
var forEach = function (array, callback, scope) {
  for (var i = 0; i < array.length; i++) {
    callback.call(scope, array[i]);
  }
};

var Stickerbook = window.Stickerbook;
var host = location.toString();

// initialize stickerbook.
var stickerbook = new Stickerbook({
  container: document.getElementById('stickerbook_container'),
  stickers: [
    host + 'images/coin.svg',
    host + 'images/playCircle.svg',
    host + 'images/star.svg'
  ],
  background: {
    enabled: [ host + 'images/background.png' ],
    default: host + 'images/background.png'
  },
  brush: {
    widths: [1, 10, 50],
    enabled: [
      'eraser',
      'bitmap',
      'bitmap-eraser',
      'fill',
      'marker',
      'pattern',
      'pencil',
      'spray'
    ],
    colors: ['#0000FF', '#FF0000']
  },
  stickerControls: {
    cornerColor: 'rgba(0,0,0,0.5)',
    cornerSize: 20
  },
  mobileEnabled: true,
  useDefaultEventHandlers: true
});

// go ahead and set some initial state
stickerbook.backgroundManager.setPositioning('fit-height');
stickerbook.setBrush('pencil');

// Wire up stickers
forEach(document.querySelectorAll('#stickers img'), function (child) {
  child.addEventListener('click', function (event) {
    stickerbook.setSticker(event.target.src);
  });
});

// wire up the background images
document.getElementById('remove-background').addEventListener('click', function () {
  stickerbook.clearBackground();
});
document.getElementById('set-background').addEventListener('click', function () {
  stickerbook.setBackground(host + 'images/background.png');
});

// wire up brushes
forEach(document.querySelectorAll('#brushes button'), function (child) {
  child.addEventListener('click', function () {
    var brushConfig = {};

    if(child.name === 'pattern') {
      stickerbook.setBrushWidth(50);
      brushConfig = {
        images: [
          host + 'images/coin.svg',
          host + 'images/star.svg'
        ]
      };
    } else if(child.name === 'bitmap' || child.name === 'bitmap-eraser') {
      stickerbook.setBrushWidth(50);
      brushConfig = { image: host + 'images/star.svg' };
    } else if(child.name === 'fill') {
      brushConfig = { isAsync: true, stepsPerFrame: 10 };
    }

    stickerbook.setBrush(child.name, brushConfig);
  });
});

// Wire up the color picker
forEach(document.querySelectorAll('.color'), function (child) {
  child.addEventListener('click', function () {
    stickerbook.setColor(child.name);
  });
});

// Wire up the brush width setter
forEach(document.querySelectorAll('.brush_width'), function (child) {
  child.addEventListener('click', function () {
    stickerbook.setBrushWidth(Number(child.name));
  });
});

// Wire up undo and redo
document.getElementById('undo').addEventListener('click', function () {
  stickerbook.undo();
});
document.getElementById('redo').addEventListener('click', function () {
  stickerbook.redo();
});

// Wire up clear
document.getElementById('clear').addEventListener('click', function () {
  stickerbook.clear();
});

// Wire up export
document.getElementById('save').addEventListener('click', function () {
  var dataUrl = window.demoStickerbook.toDataURL();
  var html = '<!DOCTYPE html>\n<html><body><img src="' + dataUrl + '"/></body></html>';
  var popup = window.open();
  popup.document.write(html);
  popup.focus();
  popup.print();
});

document.getElementById('destroy').addEventListener('click', function () {
  window.demoStickerbook.destroy();

  var nodesToRemove = document.querySelectorAll('#stickerbook_container, #controls, #stickers');
  forEach(nodesToRemove, function (node) {
    node.remove();
  });
});

// expose everything, so users can play around with it
window.demoStickerbook = stickerbook;
