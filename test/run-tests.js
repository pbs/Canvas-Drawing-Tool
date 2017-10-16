var fs = require('fs');
var page = require('webpage').create();

page.onConsoleMessage = function(message) {
  console.log(message);
};

page.onCallback = function(data) {
  var status = 0;
  if(data.failingTests && data.failingTests !== 0) {
    console.log(data.failingTests, 'tests failed');
    status = 1;

    //fs.write('test-results.html', page.content, 'w');
    page.render('export.png');
  }
  phantom.exit(status);
};

page.onLoadFinished = function() {
  var runTests = function() {
    window.mocha.run(function(failingTests) {
      window.callPhantom({ failingTests: failingTests });
    });
  };

  page.evaluateJavaScript(runTests.toString());
  setTimeout(function() {
    phantom.exit(0);
  }, 5000);
};

var path = 'file://' + fs.workingDirectory + '/test/index.html';
page.open(path);
