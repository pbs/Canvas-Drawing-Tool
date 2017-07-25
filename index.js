const Stickerbook = require('./src/stickerbook.js');
Stickerbook.VERSION = require('./package.json').version;

// attach to global object
window.Stickerbook = Stickerbook;
