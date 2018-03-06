const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const eventStream = require('event-stream');
const inject = require('gulp-inject');

const distFolder = 'dist';

gulp.task('lib', () => gulp
  .src('src/lib/*.js')
  .pipe(gulp.dest(`${distFolder}/lib`))
);

gulp.task('js', () => gulp
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
  .pipe(inject(gulp.src(['src/lib/*.js', 'src/js/*.js'], { read: false }), { relative: true }))
  .pipe(gulp.dest('./dist'))
  .pipe(browserSync.stream())
);

// Watch Sass & Serve
gulp.task('server', ['default'], () => {
  browserSync.init({
    server: `./${distFolder}`
  });
  gulp.watch('src/js/*.js', ['js']);
  gulp.watch('src/*.html', ['template']);
});

gulp.task('default', ['js', 'lib', 'template']);
