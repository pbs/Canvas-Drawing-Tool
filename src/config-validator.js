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

module.exports = {
  get
};
