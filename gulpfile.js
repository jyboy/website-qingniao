var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    csscomb = require('gulp-csscomb'),
    notify = require('gulp-notify'),
    livereload = require('gulp-livereload'),
    del = require('del');

// Scsscomb
gulp.task('scsscomb', function() {
    return gulp.src('public/stylesheets/scss/*.scss')
        .pipe(csscomb())
        .pipe(gulp.dest('public/stylesheets/scss'))
        .pipe(notify({ message: 'Scsscomb task complete' }));
});

// Styles
gulp.task('styles', function() {
    return sass('public/stylesheets/scss/*.scss', {
            style: 'compressed'
        })
        .pipe(autoprefixer({
            browsers: ['last 1 version', 'ie 10']
        }))
        .pipe(gulp.dest('public/stylesheets/css'))
        .pipe(notify({ message: 'Styles task complete' }));
});

// Clean
gulp.task('clean', function() {
    return del(['public/stylesheets/css']);
});

// Default task
gulp.task('default', ['clean', 'scsscomb', 'styles']);

// Watch
gulp.task('watch', function() {

    // Watch .scss files
    gulp.watch('public/stylesheets/scss/*.scss', ['scsscomb', 'styles']);

    // Create LiveReload server
    livereload.listen();

    // Watch any files in dist/, reload on change
    gulp.watch(['public/stylesheets/css/*']).on('change', livereload.changed);

});