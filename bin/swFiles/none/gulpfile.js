var gulp = require('gulp'),
    del = require('del'),
    concat = require('gulp-concat'),
    mainFiles = require('bower-files'),

    scssLint = require('gulp-scss-lint'),
    sass = require('gulp-ruby-sass'),
    cssPrefixer = require('gulp-autoprefixer'),
    cssMinify = require('gulp-minify-css'),

    jsLint = require('gulp-jshint'),
    jsLintRep = require('jshint-stylish'),
    jsMinify = require('gulp-uglify'),

    imageMin = require('gulp-imagemin'),

    node,
    spawn = require('child_process').spawn,
    exec = require('child_process').exec,

    src = 'src/',
    dist = 'dist/',
    paths = {
        js: src + 'js/**/*.js',
        scss: src + 'scss/**/*.scss',
        images: src + 'images/**/*.*',
        html: src + '**/*.html',
        bower: 'bower_components/**/*.*',
        scssMain: src + 'scss/main.scss'
    };

gulp.task('clean', function() {
    del(dist);
});

gulp.task('lint', ['lintJs', 'lintScss']);

gulp.task('lintJs', function() {
    return gulp.src(paths.js)
        .pipe(jsLint())
        .pipe(jsLint.reporter(jsLintRep));
});

gulp.task('lintScss', function() {
    return gulp.src(paths.scss)
        .pipe(scssLint({ config: 'lint.yml' }));
});

gulp.task('vendor', function() {
    gulp.src(mainFiles().ext('js').files)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(dist + 'lib/'));

    gulp.src(mainFiles().ext('css').files)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest(dist + 'lib/'));

    gulp.src(mainFiles().ext(['eot', 'woff', 'ttf', 'svg']).files)
    .pipe(gulp.dest(dist + 'fonts/'));
});

gulp.task('minify', function() {
    // Minify vendor.js and vendor.css
    gulp.src(dist + 'lib/vendor.css')
        .pipe(cssMinify())
        .pipe(gulp.dest(dist + 'lib/'));
    gulp.src(dist + 'lib/vendor.js')
        .pipe(jsMinify({ preserveComments: 'some'}))
        .pipe(gulp.dest(dist + 'lib/'));

    // Minify project styles and scripts
    gulp.src(dist + 'css/styles.css')
        .pipe(cssMinify())
        .pipe(gulp.dest(dist + 'css/'));
    gulp.src(dist + 'js/app.js')
        .pipe(jsMinify({ preserveComments: 'some'}))
        .pipe(gulp.dest(dist + 'js/'));
});

gulp.task('styles', function() {
    return sass(paths.scssMain,
            {
                precision: 10,
                // loadPath: []
            })
        .pipe(concat('styles.css'))
        .pipe(cssPrefixer())
        .pipe(gulp.dest(dist + 'css/'));
});

gulp.task('scripts', function() {
    return gulp.src(paths.js)
        .pipe(concat('app.js'))
        .pipe(gulp.dest(dist + 'js/'));
});

gulp.task('html', function() {
    return gulp.src(paths.html)
        .pipe(gulp.dest(dist));
});

gulp.task('images', function() {
    return gulp.src(paths.images)
        .pipe(imageMin())
        .pipe(gulp.dest(dist + 'images/'));
});

gulp.task('fbFlo', ['cleanupFbFlo'], function() {
    if (node) {
        node.kill();
    }

    node = spawn('node', ['flo.js'], {stdio: 'inherit'});
    node.on('close', function() {
        console.log('Exiting fb-flo.');
    });
});

gulp.task('cleanupFbFlo', function() {
    var fbFloRegex = /node\s_(\d+)\s/g,
        fbFloPs = exec('ps aux | grep "node flo.js"');

    fbFloPs.stdout.on('data', function(data) {
        data = data.split('\n');
        if (data) {
            var tmp;
            for (var i = 0; i < data.length; ++i) {
                tmp = data[i].split('  ');
                exec('kill -9 ' + tmp[2]);
                console.log('Killed orphaned fb-flo process.');
            }
        }
    });
});

gulp.task('watch', function() {
    var watchJs = gulp.watch(paths.js, ['lintJs', 'scripts']),
        watchScss = gulp.watch(paths.scss, ['lintScss', 'styles']),
        watchHtml = gulp.watch(paths.html, ['html']),
        watchImages = gulp.watch(paths.images, ['images']),
        watchVendor = gulp.watch(paths.bower, ['vendor']),

        onChanged = function(event) {
            console.log('File ' + event.path + ' was ' + event.type + '. Running tasks...');
        };

    gulp.start('fbFlo');

    watchJs.on('change', onChanged);
    watchScss.on('change', onChanged);
    watchHtml.on('change', onChanged);
    watchImages.on('change', onChanged);
    watchVendor.on('change', onChanged);
});

gulp.task('default', ['clean', 'lint', 'vendor', 'styles', 'scripts', 'html', 'images']);
