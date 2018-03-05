const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const eventStream = require('event-stream');
const inject = require('gulp-inject');

const distFolder = 'dist';

const jsStream = gulp.task('js', () => gulp
  .src('src/js/*.js')
  .pipe(babel({
    presets: ['env']
  }))
  .pipe(uglify())
  .pipe(gulp.dest(`${distFolder}/js`))
  .pipe(browserSync.stream())
);

gulp.task('template', () => gulp
  .src('src/*.html')
  .pipe(inject(gulp.src('src/js/*.js', {read: false}), {relative: true}))
  .pipe(gulp.dest('./dist'))
);

// Watch Sass & Serve
gulp.task('server', ['default'], () => {
  browserSync.init({
    server: `./${distFolder}`
  });
  gulp.watch('src/js/*.js', ['js']);
});

gulp.task('default', ['js', 'template']);
