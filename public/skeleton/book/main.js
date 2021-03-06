//Javascript libs
var MODULES_PATH = window.codeGenModulePath || "../modules";
var ANGULAR_LIB_PATH = MODULES_PATH + "/angular/1.4.5/",
    ANGULAR_MODULES_LIB_PATH = MODULES_PATH + "/angular-modules/",
    ANGULAR_PLUGINS_LIB_PATH = MODULES_PATH + "/angular-plugins/",
    HAMMER_LIB_PATH = MODULES_PATH + "/hammer/2.0.4/",
    JQUERY_LIB_PATH = MODULES_PATH + "/jquery/2.1.1/",
    UNDERSCORE_LIB_PATH = MODULES_PATH + "/underscore/1.6.0/",
    MODERNIZR_LIB_PATH = MODULES_PATH + "/modernizr/",
    STRING_LIB_PATH = MODULES_PATH + "/String/",
    SNAP_SVG_LIB_PATH = MODULES_PATH + "/snap/0.4.1/",
    VELOCITY_LIB_PATH = MODULES_PATH + "/velocity/1.2.2/",
    FABRIC_LIB_PATH = MODULES_PATH + "/fabric/1.5.0/",
    CHART_LIB_PATH = MODULES_PATH + "/Chart.js/1.0.2/",
    EDGE_LIB_PATH = MODULES_PATH + "/edge/5.0.1/",
    APP_LIB_PATH = "app/",
    APP_COMMON_LIB_PATH = "common/",
    DIRECTIVE_LIB_PATH = "directive/",
    isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && !/jsDom$/i.test(navigator.appName) && window.document);

//Angular app module
var APP_MODULE_NAME = "app",
    APP_MODULE_DEPS = ["ngRoute", "ngCookies", "ngTouch", "flow"];

requirejs.config({
    paths: {
        "angular-lib": ANGULAR_LIB_PATH + "main",
        "angular-modules-lib": ANGULAR_MODULES_LIB_PATH + "main",
        "angular-plugins-lib": ANGULAR_PLUGINS_LIB_PATH + "main",
        "hammer-lib": HAMMER_LIB_PATH + "main",
        "jquery-lib": JQUERY_LIB_PATH + "main",
        "underscore-lib": UNDERSCORE_LIB_PATH + "main",
        "modernizr-lib": MODERNIZR_LIB_PATH + "main",
        "string-lib": STRING_LIB_PATH + "main",
        "snap-svg-lib": SNAP_SVG_LIB_PATH + "main",
        "velocity-lib": VELOCITY_LIB_PATH + "main",
        "fabric-lib": FABRIC_LIB_PATH + "main",
        "chart-lib": CHART_LIB_PATH + "main",
        "edge-lib": EDGE_LIB_PATH + "main",
        "app-common-lib": APP_COMMON_LIB_PATH + "main",
        "app-lib": APP_LIB_PATH + "main",
        "directive-lib": DIRECTIVE_LIB_PATH + "main"
    },
    shim: {
        "app-lib": {deps: ["app-common-lib"]},
        "directive-lib": {deps: ["app-common-lib"]}
    }
});

requirejs(["angular-lib", "angular-modules-lib", "hammer-lib", "jquery-lib", "underscore-lib", "modernizr-lib", "string-lib", "snap-svg-lib", "velocity-lib", "fabric-lib", "chart-lib", "edge-lib"], function () {
    if (isBrowser) {
        window.appModule = angular.module(APP_MODULE_NAME, APP_MODULE_DEPS);
        window.appModule.value("angularEventTypes", {
            boundPropertiesEvent: "boundPropertiesEvent",
            beforeWidgetCreationEvent: "beforeWidgetCreationEvent",
            beforeBookWidgetCreationEvent: "beforeBookWidgetCreationEvent",
            resourceEditEvent: "resourceEditEvent",
            resourceEditEndEvent: "resourceEditEndEvent",
            switchProjectEvent: "switchProjectEvent",
            playProjectEvent: "playProjectEvent",
            defineWidgetRouteEvent: "defineWidgetRouteEvent",
            markWidgetRouteEvent: "markWidgetRouteEvent",
            widgetPseudoChangeEvent: "widgetPseudoChangeEvent",
            widgetContentIncludedEvent: "widgetContentIncluded"
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
            VERBOSE: true,
            widgetClasses: {
                containerClass: "sketchHolder",
                deviceHolderClass: "deviceHolder",
                holderClass: "pageHolder",
                widgetClass: "sketchWidget",
                hoverClass: "widgetHover",
                activeClass: "pickedWidget",
                widgetContainerClass: "widgetContainer",
                widgetIncludeAnchorClass: "widgetIncludeAnchor",
                currentPageClass: "currentPage",
                loadExternalSuccessClass: "loadExternalSuccess",
                loadExternalFailClass: "loadExternalFailClass"
            },
            anchorAttr: "widget-anchor",
            repoWidgetClass: "ui-widget",
            stateGroupEventPattern: "State Change Event of State Group {0}",
            widgetEventPattern: "Event {0} of widget {1}",
            waveVisualizerWorkerPath: DIRECTIVE_LIB_PATH + "wave-visualizer-worker.js",
            maxAudioClipsInMemory: 4,
            maxPageCountInDom: 10,
            draggingShapeZIndex: 101,
            actionDelay: 100,
            checkInterval: 20,
            loadCheckInterval: 40,
            unresponsiveInterval: 40,
            eventThrottleInterval: 300,
            renderTimeout: 3000,
            loadRenderTimeout: 6000,
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
        arguments[1](window.appModule);
    }

    window.modouleLogger && window.modouleLogger.debug(["angular-plugins-lib", "app-common-lib"].join(",") + " Loading");

    requirejs(["angular-plugins-lib", "app-common-lib"], function (pluginsConfig, commonConfig) {
        window.modouleLogger && window.modouleLogger.debug(["angular-plugins-lib", "app-common-lib"].join(",") + " Load Complete.");

        if (isBrowser) {
            pluginsConfig(window.appModule);
        }

        commonConfig(window.appModule, function () {
            window.modouleLogger && window.modouleLogger.debug(["directive-lib", "app-lib"].join(",") + " Loading");

            requirejs(["directive-lib", "app-lib"], function (directiveConfig, appConfig) {
                window.modouleLogger && window.modouleLogger.debug(["directive-lib", "app-lib"].join(",") + " Load Complete.");

                if (isBrowser) {
                    directiveConfig(window.appModule);

                    appConfig(window.appModule, function () {
                        angular.bootstrap(document, [APP_MODULE_NAME]);
                    });
                }

                //On load function will be bound to window object if post processing needed.
                window.onModulesLoaded && window.onModulesLoaded();
            });
        });
    });
});
