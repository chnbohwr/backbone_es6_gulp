const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const inject = require('gulp-inject');

const distFolder = 'dist/';
const sourceFolder = 'src/';

gulp.task('lib', () => gulp
  .src('src/lib/*.js', { base: sourceFolder })
  .pipe(gulp.dest(distFolder))
);

gulp.task('js', () => gulp
  .src('src/js/*.js', { base: sourceFolder })
  .pipe(babel({
    presets: ['env']
  }))
  .pipe(uglify())
  .pipe(gulp.dest(distFolder))
  .pipe(browserSync.stream())
);

gulp.task('html', () => gulp
  .src('src/*.html', { base: sourceFolder })
  .pipe(inject(gulp.src(['src/lib/*.js', 'src/js/*.js'], { read: false }), { relative: true }))
  .pipe(gulp.dest(distFolder))
  .pipe(browserSync.stream())
);

// Watch Sass & Serve
gulp.task('server', ['default'], () => {
  browserSync.init({
    server: distFolder
  });
  gulp.watch('src/js/*.js', ['js']);
  gulp.watch('src/*.html', ['html']);
});

gulp.task('default', ['js', 'lib', 'html']);
