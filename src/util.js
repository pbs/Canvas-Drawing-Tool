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

module.exports = {
  calculateInnerDimensions: calculateInnerDimensions
};
