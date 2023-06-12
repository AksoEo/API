const gulp = require('gulp');
const watch = require('gulp-watch');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const header = require('gulp-header');

const compileSrc = function (source) {
	return source
		.pipe(plumber())
		.pipe(header("import 'core-js/stable';import 'regenerator-runtime/runtime';import 'source-map-support/register';"))
		.pipe(sourcemaps.init())
		.pipe(babel({
				root: __dirname,
			}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist'))
};

gulp.task('compile-src', function () {
	return compileSrc(gulp.src(['src/**/*.js']));
});

gulp.task('watch-compile', function () {
	compileSrc(watch(['src/**/*.js']));
});
