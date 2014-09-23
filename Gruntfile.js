//Gruntfile
module.exports = function(grunt) {

  //Initializing the configuration object
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    requirejs: {
      compile: {
        options: {
          baseUrl: "./",
          name: "jdapi",
          paths: {
            jdapi: "src/jdapi",
            coreCore: "src/core/core",
            coreCrypto: "src/core/crypto",
            coreCryptoUtils: "src/core/cryptoUtils",
            coreRequest: "src/core/request",
            coreRequestHandler: "src/core/coreRequestHandler",
            device: "src/device/device",
            deviceController: "src/device/deviceController",
            serverServer: "src/server/server",
            serviceService: "src/service/service",
            CryptoJS: "vendor/cryptojs"
          },
          out: "build/jdapi.js"
        }
      }
    },
    watch: {
      requirejs: {
        files: ["src/**/*.js", "test/**/*.js", "*.html"],
        tasks: ["requirejs"],
        options: {
          livereload: true
        }
      }
    }
  });

  // Plugin loading
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Task definition
  grunt.registerTask('default', ['watch']);
};