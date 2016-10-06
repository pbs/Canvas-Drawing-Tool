/**
 * The validation rules for the stickerbook config values
 */
module.exports = {
  description: 'Stickerbook configuration',
  type: 'object',
  required: [
    'stickers',
    'background',
    'brushWidths',
    'brushes',
    'colors'
  ],
  properties: {
    stickers: {
      type: 'array',
      items: {
        type: 'string'
      }
    },

    background: {
      type: 'object',
      required: ['enabled'],
      properties: {
        enabled: {
          type: 'array',
          items: {
            type: 'string',
          }
        },
        default: {
          type: 'string'
        }
      }
    },

    brushes: {
      type: 'array',
      items: {
        type: 'string'
      }
    },

    colors: {
      type: 'array',
      items: {
        type: 'string'
      }
    },

    mobileEnabled: {
      type: 'boolean'
    },

    stickerControls: {
      type: 'object',
      required: ['cornerColor', 'cornerSize'],
      properties: {
        cornerColor: {
          type: 'string'
        },
        cornerSize: {
          type: 'integer'
        }
      }
    },

    useDefaultEventHandlers: {
      type: 'boolean'
    }
  },
};
