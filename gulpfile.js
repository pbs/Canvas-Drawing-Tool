'use strict';

const bundle = require('./gulp/bundle');
const concat = require('gulp-concat');
const express = require('express');
const gulp = require('gulp');
const uglify = require('gulp-uglify');

const path = {
  DEMO_DEST: './demo',
  DEST: './dist',
  TMP: './tmp',
  ENTRY_POINT: './index.js'
};

// Bundle tasks
gulp.task('bundle-debug', () => bundle(path.ENTRY_POINT, 'stickerbook.combined.js', [path.TMP], true));
gulp.task('bundle-release', () => bundle(path.ENTRY_POINT, 'stickerbook.dist.js', [path.TMP], true));
gulp.task('bundle-test', () => bundle('test/stickerbook.test.js', 'stickerbook.test.bundle.js', [path.TMP], true));

// concat tasks
gulp.task('concat-release', ['bundle-release'], () => {
  return gulp.src(['fabric/dist/fabric.min.js', 'tmp/stickerbook.dist.js'])
    .pipe(concat('stickerbook.dist.js'))
    .pipe(gulp.dest(path.DEST));
});

gulp.task('concat-debug', ['bundle-debug'], () => {
  return gulp.src(['fabric/dist/fabric.js', 'tmp/stickerbook.combined.js'])
    .pipe(concat('stickerbook.combined.js'))
    .pipe(gulp.dest(path.DEST))
    .pipe(gulp.dest(path.DEMO_DEST));
});

gulp.task('concat-test', ['bundle-test'], () => {
  return gulp.src(['fabric/dist/fabric.js', 'tmp/stickerbook.test.bundle.js'])
    .pipe(concat('stickerbook.test.bundle.js'))
    .pipe(gulp.dest('test'));
});

gulp.task('build', ['concat-release', 'concat-debug']);

gulp.task('watch', () => {
  'use strict';

  gulp.watch('src/*.js', ['build']);
});

gulp.task('serve', ['concat-debug'], () => {
  // run dev server
  const staticServer = express();
  staticServer.use(express.static('demo'));
  staticServer.listen(8000, function () {
    console.log('Demo app running at http://localhost:8000/');
  });
});

gulp.task('default', ['build', 'watch', 'serve']);
