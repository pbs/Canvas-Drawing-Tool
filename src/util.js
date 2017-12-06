/**
 * Calculates the width of an element, excluding margin, border, and padding
 *
 * @param {Node} element A node to calculate for
 * @returns {Object} and object with a width and height properties
 */
const calculateInnerDimensions = (element) => {
  // build an object with values for each padding value (trimming the 'px')
  var computedStyle = window.getComputedStyle(element, null);
  var padding = {};
  ['left', 'right', 'top', 'bottom'].forEach((direction) => {
    var rawValue = computedStyle.getPropertyValue(`padding-${direction}`);
    padding[direction] = Number(rawValue.replace('px', ''));
  });

  return {
    width: element.clientWidth - padding.left - padding.right,
    height: element.clientHeight - padding.top - padding.bottom
  };
};

/**
 * Splits an rgba CSS style rule into its consituent components
 * @param {String} rgba The rgba String, e.g. "rgba(1, 2, 3, 0.1)"
 * @return {Array<Number>} A length-4 array of numbers representing the individual components
 */
const rgbaToArray = rgba => rgba.replace('rgba(', '').replace(')', '').split(',').map(Number);

/**
 * Repacks an array split color back into the CSS format rgba(R, G, B, A)
 * @param {Array<Number} array The length-4 array to rejoin
 * @return {String} An rgba string
 */
const arrayToRgba = array => {
  return 'rgba(' + array[0].toFixed(0) + ', ' + array[1].toFixed(0) + ', '+ array[2].toFixed(0)
    + ', ' + array[3].toFixed(3) + ')';
};

/**
 * Uses the [over operator](https://en.wikipedia.org/wiki/Alpha_compositing#Description) to
 * composite two colors together
 * @param {Array<Number>} color1 The bottom color
 * @param {Array<Number>} color2 The top color
 * @return {Array<Number>} The composited color
 */
const compositeColors = (color1, color2) => {
  var alpha1 = color1[3];
  var alpha2 = color2[3];
  var blendedAlpha = alpha2 + alpha1 * (1 - alpha2);
  var composited = [0, 0, 0, blendedAlpha];

  // rgb components
  for(let i = 0; i < 3; i++) {
    composited[i] = (color2[i] * alpha2 + color1[i] * alpha1 * (1 - alpha2)) / blendedAlpha;
  }

  return composited;
};

module.exports = {
  calculateInnerDimensions: calculateInnerDimensions,
  rgbaToArray: rgbaToArray,
  arrayToRgba: arrayToRgba,
  compositeColors: compositeColors
};
