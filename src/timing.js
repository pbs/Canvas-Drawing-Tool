var now = function () {
  if(window.performance.now instanceof Function) {
    return window.performance.now();
  }

  return Date.now();
};

var marks = {};
var measures = {};

module.exports = {
  mark: function (name) {
    marks[name] = now();
  },

  measure: function (name, m1, m2) {
    measures[name] = marks[m2] - marks[m1];
  },

  all: function () {
    return {
      marks: marks,
      measures: measures
    };
  }
};
