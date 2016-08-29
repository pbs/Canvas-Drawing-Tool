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
  enabledBackgrounds: [
    host + 'images/background.png'
  ],
  defaultBackground: null,
  brushWidths: [1, 10, 50],
  brushes: [
    'eraser',
    'fill',
    'marker',
    'pattern',
    'pencil',
    'spray'
  ],
  colors: ['#0000FF', '#FF0000'],
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
forEach(document.getElementById('stickers').childNodes, function (child) {
  if (child.nodeName === 'IMG') {
    child.addEventListener('click', function (event) {
      stickerbook.setSticker(event.target.src);
    });
  }
});

// wire up the background images
document.getElementById('remove-background').addEventListener('click', function () {
  stickerbook.clearBackground();
});
document.getElementById('set-background').addEventListener('click', function () {
  stickerbook.setBackground(host + 'images/background.png');
});

// wire up brushes
forEach(document.getElementById('brushes').childNodes, function (child) {
  if (child.nodeName === 'BUTTON') {
    child.addEventListener('click', function () {
      if (child.name === 'example-pattern') {
        stickerbook.setBrushWidth(50);
        stickerbook.setBrush('pattern', {
          images: [
            host + 'images/coin.svg',
            host + 'images/star.svg'
          ]
        });
      } else {
        stickerbook.setBrush(child.name);
      }
    });
  }
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
