/**
 * Gets a nested object value for a particular key
 * @param {Object} object The object to get a value from
 * @param {String} key The object key to get
 * @return {Object} Could be anything
 */
const get = function (object, key) {
  const tokens = key.split('.');
  var pointer = object;

  for(var i = 0; i < tokens.length; i++) {
    pointer = pointer[tokens[i]];
    if (pointer === undefined) {
      return undefined;
    }
  }

  return pointer;
};

const validateSingle = function (value, type) {
  if (type === 'Array') {
    return value instanceof Array;
  } else if (type === 'String') {
    return typeof value === 'string';
  } else if (type === 'Number') {
    return typeof value === 'number';
  } else if (type === 'Boolean') {
    return typeof value === 'boolean';
  }

  throw new Error('Cannot validate against unsupported type ' + type);
};

/**
 * Validates an object based on a series of validation rules provided. Returns an array of error
 * messages. If the array is empty, the validation was successful.
 *
 * Example ruleset might be:
 * {
 *   'A' : {
 *     type: 'Boolean',
 *     message: 'A is not a boolean'
 *   },
 *   'B' : {
 *     type: 'String',
 *     message: 'B should be a string'
 *   },
 *   'C.D' : { // a nested key!
 *     type: 'Number',
 *     message: 'D should be a number'
 *   }
 * }
 *
 * @param {Object} object The object to validate
 * @param {Object} rules The list of validation rules to use
 * @return {Array} The list of error messages. If empty, the object is considered valid
 */
const validate = function (object, rules) {
  return Object.keys(rules)
    .filter((key) => {
      var value = get(object, key);
      return !validateSingle(value, rules[key].type);
    })
    .map((key) => {
      return rules[key].message;
    });
};

module.exports = {
  get,
  validate
};
