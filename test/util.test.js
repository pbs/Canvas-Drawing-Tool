const expect = require('expect');
const sinon = require('sinon');

const util = require('../src/util.js');

describe('util', () => {
  const assertArrayMatch = (a1, a2) => {
    expect(a1.length).toEqual(a2.length);

    for(let i = 0; i < a1.length; i++) {
      let message = `${a1[i]} is not close to ${a2[i]} (at index ${i})`;
      expect(Math.abs(a2[i] - a1[i])).toBeLessThan(0.001, message);
    }
  };

  describe('rgbaToArray', () => {
    it('should split colors correctly', () => {
      var result = util.rgbaToArray('rgba(1, 2, 3, 0.1)');
      assertArrayMatch(result, [1, 2, 3, 0.1]); 
    });
  });

  describe('arrayToRgba', () => {
    it('should format properly', () => {
      var result = util.arrayToRgba([1, 2, 3, 0.1]);
      expect(result).toEqual('rgba(1, 2, 3, 0.100)');
    });

    it('should round floats accordingly', () => {
      var result = util.arrayToRgba([1.2, 6.7, 2.9, 0.123567]);
      expect(result).toEqual('rgba(1, 7, 3, 0.124)');
    });
  });

  describe('compositeColors', () => {
    it('should overlay the second over the first, according to the formula', () => {
      var color1 = [1, 1, 200, 0.7];
      var color2 = [2, 255, 100, 0.5];

      var result = util.compositeColors(color1, color2);
      assertArrayMatch(result, [1.588, 150.412, 141.176, 0.85]);
    });
  });
});
