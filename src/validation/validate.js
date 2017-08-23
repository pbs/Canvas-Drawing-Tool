const Ajv = require('ajv');

/**
 * Validates an object against a schema, throwing an exception if a field is invalid
 *
 * @param {Object} schema The JSON schema to use for validation
 * @param {Object} object The object to validate
 *
 * @return {Boolean} true if the object is valid
 * @throws Error An error with validation error messages in it
 */
module.exports = function (schema, object) {
  const validator = new Ajv();
  const isValid = validator.validate(schema, object);

  if(isValid) {
    return true;
  }

  const formattedErrors = validator.errors.map((error) => {
    const field = error.dataPath.replace(/^\./, '');
    return field + ' ' + error.message;
  });

  throw new Error(formattedErrors.join(' '));
};
