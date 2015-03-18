//Javascript libs
var ANGULAR_LIB_PATH = "javascripts/angular/1.3.0-beta.8/",
    ANGULAR_MODULES_LIB_PATH = "javascripts/angular-modules/",
    ANGULAR_PLUGINS_LIB_PATH = "javascripts/angular-plugins/",
    HAMMER_LIB_PATH = "javascripts/hammer/2.0.4/",
    JQUERY_LIB_PATH = "javascripts/jquery/2.1.1/",
    JQUERY_PLUGINS_LIB_PATH = "javascripts/jquery-plugins/",
    JQUERY_UI_LIB_PATH = "javascripts/jquery-ui/1.11.0/",
    JQUERY_UI_PLUGINS_LIB_PATH = "javascripts/jquery-ui-plugins/",
    UNDERSCORE_LIB_PATH = "javascripts/underscore/1.6.0/",
    CKEDITOR_LIB_PATH = "javascripts/ckeditor/4.4.5/",
    APP_LIB_PATH = "app/",
    DIRECTIVE_LIB_PATH = "directive/";

//Angular app module
var APP_MODULE_NAME = "app",
    APP_MODULE_DEPS = ["ngRoute", "ngCookies", "ngTouch", "flow"];

//String.min.js is a must for String.prototype.format
require.config({
    paths: {
        "angular-lib": ANGULAR_LIB_PATH + "main",
        "angular-modules-lib": ANGULAR_MODULES_LIB_PATH + "main",
        "angular-plugins-lib": ANGULAR_PLUGINS_LIB_PATH + "main",
        "hammer-lib": HAMMER_LIB_PATH + "main",
        "jquery-lib": JQUERY_LIB_PATH + "main",
        "jquery-plugins-lib": JQUERY_PLUGINS_LIB_PATH + "main",
        "jquery-ui-lib": JQUERY_UI_LIB_PATH + "main",
        "jquery-ui-plugins-lib": JQUERY_UI_PLUGINS_LIB_PATH + "main",
        "underscore-lib": UNDERSCORE_LIB_PATH + "main",
        "ckeditor-lib": CKEDITOR_LIB_PATH + "main",
        "app-lib": APP_LIB_PATH + "main",
        "directive-lib": DIRECTIVE_LIB_PATH + "main"
    },
    waitSeconds: 0
});

require(["jquery-lib", "jquery-plugins-lib", "hammer-lib", "jquery-ui-lib", "jquery-ui-plugins-lib", "angular-lib", "angular-modules-lib", "underscore-lib", "ckeditor-lib"], function () {
    window.appModule = angular.module(APP_MODULE_NAME, APP_MODULE_DEPS);
    window.appModule.value("angularEventTypes", {
        boundPropertiesEvent: "boundPropertiesEvent",
        beforeWidgetCreationEvent: "beforeWidgetCreationEvent",
        switchProjectEvent: "switchProjectEvent"
    });
    window.appModule.value("angularConstants", {
        precision: 1000,
        percentPrecision: 1000,
        treeNodeIdPrefix: "tree-node-",
        repoTypes: [
            {name: "widget", value: "widget"},
            {name: "effect", value: "effect"},
            {name: "icon", value: "icon"}
        ],
        widgetClasses: {
            containerClass: "sketchHolder",
            deviceHolderClass: "deviceHolder",
            holderClass: "pageHolder",
            widgetClass: "sketchWidget",
            hoverClass: "widgetHover",
            activeClass: "pickedWidget",
            widgetContainerClass: "widgetContainer"
        },
        anchorAttr: "widget-anchor",
        draggingShapeZIndex: 101,
        actionDelay: 100,
        checkInterval: 10,
        renderTimeout: 3000,
        loadTimeout: 10000
    });
    //For upload file angular module 'ng-flow'
    window.appModule.config(['flowFactoryProvider', function (flowFactoryProvider) {
        flowFactoryProvider.defaults = {
            target: function (fileObj) {
                return 'api/public/file';
            },
            permanentErrors: [404, 500, 501],
            maxChunkRetries: 1,
            chunkRetryInterval: 5000,
            simultaneousUploads: 4
        };
        flowFactoryProvider.on('catchAll', function (event) {
        });
    }]);


    //Angular Modules Config
    arguments[6](window.appModule);

    require(["angular-plugins-lib", "directive-lib", "app-lib"], function () {
        var configs = Array.prototype.slice.call(arguments);

        configs.forEach(function (config) {
            config(window.appModule);
        });

        angular.bootstrap(document, [APP_MODULE_NAME]);
    });
});
