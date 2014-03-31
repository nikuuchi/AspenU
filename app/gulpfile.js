var gulp    = require('gulp');
var gutil   = require('gulp-util');
var tsc     = require('gulp-tsc');
var jade    = require('gulp-jade');
var stylus = require('gulp-stylus');

gulp.task('default', function() {
    gulp.src(['src/ts/*.ts'])
        .pipe(tsc({out: 'index.js'}))
        .pipe(gulp.dest("static/js/"));
    gulp.src(['src/jade/*.jade'])
        .pipe(jade({pretty: true}))
        .pipe(gulp.dest("templates/"));
    gulp.src(['src/stylus/*.styl'])
        .pipe(stylus({ set: ['compress'] }))
        .pipe(gulp.dest("static/css/"));
});
