// DOC: Error Host key verification failed. jenkins user
// https://pinchukov.net/blog/gulp-rsync.html

// REQUIRES // ------------------------------
const argv = require('yargs').argv;
const signale = require('signale');
const gulp = require('gulp');
const rsync = require('gulp-rsync');
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const csso = require('gulp-csso');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const preprocess = require('gulp-preprocess');
// -------------------------------------------

// VARS // -----------------------------------
const srcPath = '.';
const ftp_domain = argv.domain;
const ssh_username = argv.sshusername; //tresdoce.com.ar
const ssh_server = argv.sshserver; //s222943.gridserver.com
const require_env = argv.requireenv;
let excludesFiles = ['.bowerrc', '.DS_Store', '.gitignore', 'bower.json', 'composer.json', 'composer.lock', 'package.json', 'package-lock.json', 'readme.md', 'README.md', 'README', 'readme', 'gulpfile.js', 'logs', 'migrations', 'node_modules', '.git', '.git-ftp-ignore', 'jenkins-theme', 'pipelines', 'temp','_config.yml'];

if (require_env == "No"){
    excludesFiles.push('.env', '.env.prod');
}
// -------------------------------------------

// OPTIMIZE // ---------------------------------
gulp.task('image-optim', () => {
    return gulp.src(`${srcPath}/assets/images/**/*`)
        .pipe(imagemin({
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(`${srcPath}/assets/images`));
});

gulp.task('csso', () => {
    return gulp.src(`${srcPath}/assets/css/*.css`)
        .pipe(sourcemaps.init())
        .pipe(csso({
            restructure: true,
            sourceMap: true,
            debug: false
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(`${srcPath}/assets/css`));
});

gulp.task('autoprefix', () => {
    //return gulp.src(`assets/css/app.css`)
    return gulp.src(`${srcPath}/assets/css/*.css`)
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest(`${srcPath}/assets/css`));
});

gulp.task('optimized', ['image-optim', 'csso', 'autoprefix']);
// -------------------------------------------

// RSYNC // ----------------------------------
gulp.task('rsync', () => {
    signale.debug("SRC: ",srcPath);
    signale.debug("DOMAIN: ",ftp_domain);
    signale.debug("SSH USERNAME: ",ssh_username);
    signale.debug("SSH SERVER: ",ssh_server);
    signale.debug("EXCLUDE FILES:", excludesFiles.toString());
    //return gulp.src([`./${srcPath}/`])
    return gulp.src(['./'])
        .pipe(rsync({
            //root: `./${srcPath}/`,
            root: `./`,
            hostname: `${ssh_username}@${ssh_server}`,
            destination: `/nfs/c12/h01/mnt/222943/domains/${ftp_domain}/html`,
            incremental: true,
            progress: true,
            compress: true,
            recursive: true,
            update: true,
            archive: true,
            clean:true,
            exclude: excludesFiles
        }));
});

gulp.task('deploy', ['rsync']);
// -------------------------------------------

// REMOVE ADMIN // ---------------------------
gulp.task('remove:admin-files', () => {
    return del([
        'app/templates/admin',
        'assets/css/admin',
        'assets/images/admin',
        'assets/js/admin',
        'assets/js/admin.js'
    ]);
});

gulp.task('clean:admin-config', () => {
    return gulp.src(['config/config.php'])
        .pipe(preprocess({ context: { REMOVE_ADMIN: true } }))
        .pipe(gulp.dest('./config/'));
});

gulp.task('clean:admin-routes', () => {
    return gulp.src(['app/routes.php'])
        .pipe(preprocess({ context: { REMOVE_ADMIN: true } }))
        .pipe(gulp.dest('./app/'));
});

gulp.task('remove:admin', ['remove:admin-files', 'clean:admin-config', 'clean:admin-routes']);
// -------------------------------------------

// REMOVE DB // ------------------------------
gulp.task('remove:db-files', () => {
    return del([
        'config/phinx.php',
        'migrations',
        'app/templates/login.php',
        'app/templates/register.php',
        'app/templates/protected.php'
    ]);
});

gulp.task('clean:db-config', () => {
    return gulp.src(['config/config.php'])
        .pipe(preprocess({ context: { REMOVE_DB: true } }))
        .pipe(gulp.dest('./config/'));
});

gulp.task('clean:db-routes', () => {
    return gulp.src(['app/routes.php'])
        .pipe(preprocess({ context: { REMOVE_DB: true } }))
        .pipe(gulp.dest('./app/'));
});

gulp.task('remove:db', ['remove:db-files', 'clean:db-config', 'clean:db-routes']);
// -------------------------------------------

// REMOVE ADMIN AND DB // --------------------
gulp.task('remove:admin-db-files', () => {
    return del([
        'app/templates/admin',
        'assets/css/admin',
        'assets/images/admin',
        'assets/js/admin',
        'assets/js/admin.js',
        'config/phinx.php',
        'migrations',
        'app/templates/login.php',
        'app/templates/register.php',
        'app/templates/protected.php'
    ]);
});

gulp.task('clean:admin-db-config', () => {
    return gulp.src(['config/config.php'])
        .pipe(preprocess({ context: { REMOVE_ADMIN: true, REMOVE_DB: true } }))
        .pipe(gulp.dest('./config/'));
});

gulp.task('clean:admin-db-routes', () => {
    return gulp.src(['app/routes.php'])
        .pipe(preprocess({ context: { REMOVE_ADMIN: true, REMOVE_DB: true } }))
        .pipe(gulp.dest('./app/'));
});

gulp.task('remove:admin-db', ['remove:admin-db-files', 'clean:admin-db-config', 'clean:admin-db-routes']);
// -------------------------------------------
