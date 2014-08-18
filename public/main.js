//Javascript libs
var ANGULAR_LIB_PATH = "javascripts/angular/1.3.0-beta.8/",
    JQUERY_LIB_PATH = "javascripts/jquery/2.1.1/",
    JQUERY_UI_LIB_PATH = "javascripts/jquery-ui/1.11.0/",
    UNDERSCORE_LIB_PATH = "javascripts/underscore/1.6.0/",
    APP_LIB_PATH = "app/",
    DIRECTIVE_LIB_PATH = "directive/";

//Angular app module
var APP_MODULE_NAME = "app",
    APP_MODULE_DEPS = ["ngRoute", "ngCookies", "ngTouch"];

//String.min.js is a must for String.prototype.format
require.config({
    paths: {
        "jquery-lib": JQUERY_LIB_PATH + "main",
        "jquery-ui-lib": JQUERY_UI_LIB_PATH + "main",
        "angular-lib": ANGULAR_LIB_PATH + "main",
        "underscore-lib": UNDERSCORE_LIB_PATH + "main",
        "app-lib": APP_LIB_PATH + "main",
        "directive-lib": DIRECTIVE_LIB_PATH + "main"
    },

    shim: {
        "jquery-ui-lib": {deps: ["jquery-lib"]},
        "app-lib": {deps: ["angular-lib", "jquery-lib", "directive-lib"]},
        "directive-lib": {deps: ["angular-lib", "jquery-lib"]}
    }
});

require(["jquery-lib", "jquery-ui-lib", "angular-lib", "underscore-lib"], function () {
    window.appModule = angular.module(APP_MODULE_NAME, APP_MODULE_DEPS);

    require(["app-lib", "directive-lib"], function () {
        var configs = Array.prototype.slice.call(arguments);

        configs.forEach(function (config) {
            config(appModule);
        });

        angular.bootstrap(document, [APP_MODULE_NAME]);
    });
});
