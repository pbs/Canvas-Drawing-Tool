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

  describe('validate', () => {
    it('should be able to validate a string', () => {
      var badObject = { key: 10 };
      var goodObject = { key: 'ten' };
      var rules = {
        'key' : {
          type: 'String',
          message: 'not a string'
        }
     };

      expect(configValidator.validate(badObject, rules)).toEqual(['not a string']);
      expect(configValidator.validate(goodObject, rules)).toEqual([]);
    });

    it('should be able to validate a number', () => {
      var badObject = { key: 'ten' };
      var goodObject = { key: 10 };
      var rules = {
        'key': {
          type: 'Number',
          message: 'not a number'
        }
      };

      expect(configValidator.validate(badObject, rules)).toEqual(['not a number']);
      expect(configValidator.validate(goodObject, rules)).toEqual([]);
    });

    it('should be able to validate a boolean', () => {
      var badObject = { key: 'ten' };
      var goodObject = { key: true };
      var rules = {
        'key': {
          type: 'Boolean',
          message: 'not a bool'
        }
      };

      expect(configValidator.validate(badObject, rules)).toEqual(['not a bool']);
      expect(configValidator.validate(goodObject, rules)).toEqual([]);
    });

    it('should be able to validate an Array', () => {
      var badObject = { key: 'nope' };
      var goodObject = { key: [1, 2, 3] };
      var rules = {
        'key' : {
          type: 'Array',
          message: 'not an array'
        }
      };

      expect(configValidator.validate(badObject, rules)).toEqual(['not an array']);
      expect(configValidator.validate(goodObject, rules)).toEqual([]);
    });

    it('should allow values to be optional', () => {
      var rules = {
        A : {
          type: 'Number',
          message: 'not a number',
          optional: true
        }
      };

      var goodObject = { };
      var badObject = { A: 'Nope' };

      expect(configValidator.validate(goodObject, rules)).toEqual([]);
      expect(configValidator.validate(badObject, rules)).toEqual(['not a number']);
    });

    it('should return an array of validation errors that fail', () => {
      var rules = {
        A : {
          type: 'Number',
          message: 'not a number'
        },
        B : {
          type: 'String',
          message: 'not a string'
        },
        'C.D' : {
          type: 'Boolean',
          message: 'c.d. fails'
        }
      };

      var object = {
        A: 7,
        B: false,
        C: {
          D: true
        }
      };

      var result = configValidator.validate(object, rules);
      expect(result.length).toEqual(1);
      expect(result[0]).toEqual(['not a string']);
    });
  });
});
