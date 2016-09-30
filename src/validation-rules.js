/**
 * The validation rules for the stickerbook config values
 */
module.exports = {
  stickers: {
    type: 'Array',
    message: '"stickers" configuration must be an array of strings'
  },
  'background.enabled': {
    type: 'Array',
    message: 'Enabled backgrounds configuration must be an array of strings'
  },
  'background.default': {
    type: 'String',
    message: 'Default background must be a string',
    optional: true
  },
  brushes: {
    type: 'Array',
    message: 'Brushes configuration must be an array of strings'
  },
  colors: {
    type: 'Array',
    message: 'Colors configuration must be an array of colors'
  },
  mobileEnabled: {
    type: 'Boolean',
    message: 'Mobile enabled configuration must be a string',
    optional: true
  },
  'stickerControls.cornerColor': {
    type: 'String',
    message: 'The sticker controls color must be a string',
    optional: true
  },
  'stickerControls.cornerSize': {
    type: 'Number',
    message: 'The corner control size must be a number',
    optional: true
  }
};
