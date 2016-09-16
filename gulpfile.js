'use strict';

const browserify = require('browserify');
const express = require('express');
const gulp = require('gulp');
const source = require('vinyl-source-stream');
const streamify = require('gulp-streamify');
const uglify = require('gulp-uglify');

const path = {
  OUT: './stickerbook.dist.js',
  DEMO_DEST: './demo',
  DEST: './dist',
  ENTRY_POINT: './index.js'
};

const bundle = (entryPoint, outputFilename, outputDestinations, debug) => {
  // default options for debug mode
  debug = debug === true ? true : false;

  var inProcessBundle = browserify(entryPoint, { debug: debug })
    .transform('babelify')
    .bundle()
    .pipe(source(outputFilename));

  if(!debug) {
    inProcessBundle = inProcessBundle.pipe(streamify(uglify()));
  }

  outputDestinations.forEach(destination => {
    inProcessBundle = inProcessBundle.pipe(gulp.dest(destination));
  });

  return inProcessBundle;
};

gulp.task('watch', () => {
  'use strict';

  gulp.watch('src/*.js', ['build']);
});

gulp.task('serve', () => {
  // run dev server
  const staticServer = express();
  staticServer.use(express.static('demo'));
  staticServer.listen(8000, function () {
    console.log('Demo app running at http://localhost:8000/');
  });
});

gulp.task('build', () => {
  'use strict';

  return bundle(path.ENTRY_POINT, path.OUT, [path.DEST, path.DEMO_DEST]);
});

gulp.task('build-test', () => {
  return bundle(
    './test/stickerbook.test.js',
    'stickerbook.test.bundle.js',
    ['test']
  );
});

gulp.task('default', ['build', 'watch', 'serve']);
