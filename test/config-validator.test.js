/* eslint-env mocha */
'use strict';

const expect = require('expect');

const configValidator = require('../src/config-validator');

describe('config-validator', () => {
  describe('get', () => {
    it('should return nested fields of an object', () => {
      var obj = {
        A: {
          B: {
            C: 42
          }
        }
      };

      expect(configValidator.get(obj, 'A.B.C')).toEqual(42);
    });

    it('should return undefined for a field that does not exist', () => {
      var obj = {
        A: 'hello'
      };

      expect(configValidator.get(obj, 'A.B.C')).toEqual(undefined);
    });
  });
});
