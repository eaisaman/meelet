'use strict';
var path = require('path');

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        express : {
            options: {
                // Override defaults here
                // Override the command used to start the server.
                // (do not use 'coffee' here, the server will not be able to restart
                //  see below at opts for coffee-script support)
                cmd: process.argv[0],

                // Will turn into: `node OPT1 OPT2 ... OPTN path/to/server.js ARG1 ARG2 ... ARGN`
                // (e.g. opts: ['node_modules/coffee-script/bin/coffee'] will correctly parse coffee-script)
                opts: [ ],
                args: [ ],

                // Setting to `false` will effectively just run `node path/to/server.js`
                background: true,

                // Called when the spawned server throws errors
                fallback: function() {},

                // Override node env's PORT
                port: 3000,

                // Override node env's NODE_ENV
                node_env: undefined,

                // Consider the server to be "running" after an explicit delay (in milliseconds)
                // (e.g. when server has no initial output)
                delay: 0,

                // Regular expression that matches server output to indicate it is "running"
                output: ".+",

                // Set --debug
                debug: false
            },
            dev: {
                options: {
                    script: './bin/www',
                    node_env: 'development'
                }
            },
            prod: {
                options: {
                    script: './bin/www',
                    node_env: 'production'
                }
            },
            test: {
                options: {
                    script: './bin/www'
                }
            }
        },
        watch: {
            express: {
                files:  [ '**/*.js' ],
                tasks:  [ 'express:dev' ],
                options: {
                    spawn: false // for grunt-contrib-watch v0.5.0+, "nospawn: true" for lower versions. Without this option specified express won't be reloaded
                }
            }
        }//,
//        concat : {
//            css : {
//                src: ['public/desktop/stylesheets/*.css', 'public/desktop/stylesheets/bootstrap/*.css'],
//                dest:'public/desktop/stylesheets/desktop.css'
//            }
//        },
//        cssmin: {
//            css: {
//                src:'public/desktop/stylesheets/desktop.css',
//                dest:'public/desktop/stylesheets/desktop-min.css'
//            }
//        }
    });

    // 任务加载
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
//    grunt.loadNpmTasks('grunt-contrib-concat');
//    grunt.loadNpmTasks('grunt-css');

    // 自定义任务
    grunt.registerTask('default', [ 'express:dev', 'watch'])
//    grunt.registerTask('default', [ 'express:dev', 'watch', 'concat','cssmin' ])
};