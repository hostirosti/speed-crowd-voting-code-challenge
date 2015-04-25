/*
   Copyright 2015, Google, Inc.
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var gulp            = require('gulp');
var connect         = require('gulp-connect');
var openPage        = require("gulp-open");
var webpack         = require('gulp-webpack');



/**
*  HTML
*
*  reload html
*/

gulp.task("reload", function() {
  var stream = gulp.src('*.html')
    .pipe(connect.reload());

  return stream;
});

/**
*  CONNECT SERVER
*
*  Loads the server locally and reloads when
*  connect.reload() is called.
*/
gulp.task('connect', function() {
  connect.server({
    root: '.',
    port: 8000,
    livereload: true
  });
});

gulp.task('watch', function () {
  gulp.watch(['./js/*.js'], ['reload']);
  gulp.watch(['./*.html'], ['reload']);
  gulp.watch(['./css/*.css'], ['reload']);
});

/**
*  BUILD TASKS
*
*  Local and production build tasks
*/
gulp.task('default', ['watch', 'connect'], function() {
  //Now open in browser
  var stream = gulp.src("index.html")
      .pipe(openPage("", {
        app: "Google Chrome",
        url: "http://localhost:8000"
      }));

  return stream;
});