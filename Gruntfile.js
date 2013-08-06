module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'app/scripts/<%= pkg.name %>.js',
        dest: 'build/scripts/<%= pkg.name %>.min.js'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  var connect = require('connect');

  grunt.registerTask('server', 'Start a custom web server.', function() {
    var done = this.async();
    grunt.log.writeln('Starting web server on port 8080.');
    var spawn = require('child_process').spawn;
    spawn('open', ['http://localhost:8080']);
    connect(connect.static('app')).listen(8080).on('close', done);
  });

  // Default task(s).
  grunt.registerTask('default', ['uglify']);

};