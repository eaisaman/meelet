//Javascript libs
var ANGULAR_LIB_PATH = "javascripts/angular/1.4.5/",
    ANGULAR_MODULES_LIB_PATH = "javascripts/angular-modules/",
    ANGULAR_PLUGINS_LIB_PATH = "javascripts/angular-plugins/",
    HAMMER_LIB_PATH = "javascripts/hammer/2.0.4/",
    JQUERY_LIB_PATH = "javascripts/jquery/2.1.1/",
    JQUERY_PLUGINS_LIB_PATH = "javascripts/jquery-plugins/",
    JQUERY_UI_LIB_PATH = "javascripts/jquery-ui/1.11.0/",
    JQUERY_UI_PLUGINS_LIB_PATH = "javascripts/jquery-ui-plugins/",
    UNDERSCORE_LIB_PATH = "javascripts/underscore/1.6.0/",
    MODERNIZR_LIB_PATH = "javascripts/modernizr/",
    STRING_LIB_PATH = "javascripts/String/",
    BOOTSTRAP_LIB_PATH = "javascripts/bootstrap/3.2.0/",
    RAPHAEL_LIB_PATH = "javascripts/raphael/2.1.2/",//Depended by flowchart, sequence-diagram
    FLOWCHART_LIB_PATH = "javascripts/flowchart/1.4.0/", //Depended by editormd
    JQUERY_FLOWCHART_LIB_PATH = "javascripts/jquery.flowchart/1.0.0/", //Depended by editormd
    SEQUENCE_DIAGRAM_LIB_PATH = "javascripts/sequence-diagram/1.0.4/", //Depended by editormd
    KATEX_LIB_PATH = "javascripts/katex/0.3.0/",//Depended by editormd
    CODEMIRROR_LIB_PATH = "javascripts/codemirror/5.2.0/",//Depended by editormd
    MARKED_LIB_PATH = "javascripts/marked/0.3.3/",//Depended by editormd
    PRETTIFY_LIB_PATH = "javascripts/prettify/r298/",//Depended by editormd
    EDITORMD_LIB_PATH = "javascripts/editormd/1.4.3/",
    SNAP_SVG_LIB_PATH = "javascripts/snap/0.4.1/",
    VELOCITY_LIB_PATH = "javascripts/velocity/1.2.2/",
    WAVESURFER_LIB_PATH = "javascripts/wavesurfer/1.0.29/",
    FABRIC_LIB_PATH = "javascripts/fabric/1.5.0/",
    NODE_UUID_LIB_PATH = "javascripts/node-uuid/1.4.7/",
    POMELO_LIB_PATH = "pomelo/",
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
        "jquery-plugins-lib": JQUERY_PLUGINS_LIB_PATH + "main",
        "jquery-ui-lib": JQUERY_UI_LIB_PATH + "main",
        "jquery-ui-plugins-lib": JQUERY_UI_PLUGINS_LIB_PATH + "main",
        "underscore-lib": UNDERSCORE_LIB_PATH + "main",
        "modernizr-lib": MODERNIZR_LIB_PATH + "main",
        "string-lib": STRING_LIB_PATH + "main",
        "bootstrap-lib": BOOTSTRAP_LIB_PATH + "main",
        "raphael-lib": RAPHAEL_LIB_PATH + "main",
        "flowchart-lib": FLOWCHART_LIB_PATH + "main",
        "jquery-flowchart-lib": JQUERY_FLOWCHART_LIB_PATH + "main",
        "sequence-diagram-lib": SEQUENCE_DIAGRAM_LIB_PATH + "main",
        "katex-lib": KATEX_LIB_PATH + "main",
        "codemirror-lib": CODEMIRROR_LIB_PATH + "main",
        "marked-lib": MARKED_LIB_PATH + "main",
        "prettify-lib": PRETTIFY_LIB_PATH + "main",
        "editormd-lib": EDITORMD_LIB_PATH + "main",
        "snap-svg-lib": SNAP_SVG_LIB_PATH + "main",
        "velocity-lib": VELOCITY_LIB_PATH + "main",
        "wavesurfer-lib": WAVESURFER_LIB_PATH + "main",
        "fabric-lib": FABRIC_LIB_PATH + "main",
        "node-uuid-lib": NODE_UUID_LIB_PATH + "main",
        "pomelo-lib": POMELO_LIB_PATH + "main",
        "app-common-lib": APP_COMMON_LIB_PATH + "main",
        "app-lib": APP_LIB_PATH + "main",
        "directive-lib": DIRECTIVE_LIB_PATH + "main"
    },
    shim: {
        "app-lib": {deps: ["app-common-lib"]},
        "directive-lib": {deps: ["app-common-lib"]}
    },
    waitSeconds: 0
});

requirejs(["jquery-lib", "jquery-plugins-lib", "hammer-lib", "jquery-ui-lib", "jquery-ui-plugins-lib", "angular-lib", "angular-modules-lib", "pomelo-lib", "underscore-lib", "modernizr-lib", "string-lib", "bootstrap-lib", "editormd-lib", "snap-svg-lib", "velocity-lib", "wavesurfer-lib", "fabric-lib", "node-uuid-lib"], function () {
    if (isBrowser) {
        window.appModule = angular.module(APP_MODULE_NAME, APP_MODULE_DEPS);
        window.appModule.value("angularEventTypes", {
            boundPropertiesEvent: "boundPropertiesEvent",
            beforeWidgetCreationEvent: "beforeWidgetCreationEvent",
            beforeBookWidgetCreationEvent: "beforeBookWidgetCreationEvent",
            beforeVideoWidgetCreationEvent: "beforeVideoWidgetCreationEvent",
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
            pomeloSignal: {
                'inviteSignal': 901,
                'messageSignal': 902,
                'acceptSignal': 903,

                'chatInviteSignal': 1001,
                'chatConnectSignal': 1002,
                'chatDisconnectSignal': 1003,
                'chatPauseSignal': 1004,
                'chatResumeSignal': 1005,
                'chatMessageSignal': 1006,
                'chatAcceptSignal': 1007,
                'chatCloseSignal': 1008,

                'topicInviteSignal': 2001,
                'topicPauseSignal': 2002,
                'topicResumeSignal': 2003,
                'topicMessageSignal': 2004,
                'topicCloseSignal': 2005,
                'topicDisconnectSignal': 2006
            },
            pomeloEventType: {
                'inviteEvent': "invite",
                'messageEvent': "message",
                'acceptEvent': "accept",

                'chatInviteEvent': "chatInvite",
                'chatConnectEvent': "chatConnect",
                'chatDisconnectEvent': "chatDisconnect",
                'chatPauseEvent': "chatPause",
                'chatResumeEvent': "chatResume",
                'chatMessageEvent': "chatResume",
                'chatAcceptEvent': "chatAccept",
                'chatCloseEvent': "chatClose",

                'topicInviteEvent': "topicInvite",
                'topicPauseEvent': "topicPause",
                'topicResumeEvent': "topicResume",
                'topicMessageEvent': "topicMessage",
                'topicCloseEvent': "topicClose",
                'topicDisconnectEvent': "topicDisconnect"
            },
            pomeloMemberCategory: {
                creatorCategory: 1,
                guestCategory: 2
            },
            pomeloMemberType: {
                userMemberType: 1,
                topicMemberType: 2
            },
            pomeloConversationType: {
                textType: 1,
                imageType: 2,
                videoType: 3,
                locationType: 4,
                voiceType: 5,
                fileType: 6
            },
            pomeloState: {
                chatOpenState: 1,
                chatPauseState: 2,
                chatCloseState: 3,
                chatDestroyState: 4,

                topicOpenState: 11,
                topicPauseState: 12,
                topicCloseState: 13,
                topicDestroyState: 14
            },
            pomeloRoute: {
                defaultChatRoute: 'SIRIUS_CHAT_ROUTE'
            },
            pomeloChannel: {
                loginChannel: "SIRIUS_LOGIN_CHANNEL"
            },
            pomeloInitTimeout: 500,
            pomeloPushTimeout: 800,
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
        arguments[6](window.appModule);

        //Pomelo Module Load Function
        (window.pomeloContext = window.pomeloContext || {}).load = arguments[7];
        arguments[7](window.appModule);
    }

    window.modouleLogger && window.modouleLogger.debug(["angular-plugins-lib", "app-common-lib", "directive-lib", "app-lib"].join(",") + " Loading");

    requirejs(["angular-plugins-lib", "app-common-lib"], function (pluginsConfig, commonConfig) {
        window.modouleLogger && window.modouleLogger.debug(["angular-plugins-lib", "app-common-lib"].join(",") + " Load Complete.");

        if (isBrowser) {
            pluginsConfig(window.appModule);

            commonConfig(window.appModule, function () {
                requirejs(["directive-lib", "app-lib"], function () {
                    window.modouleLogger && window.modouleLogger.debug(["directive-lib", "app-lib"].join(",") + " Load Complete.");

                    if (isBrowser) {
                        var configs = Array.prototype.slice.call(arguments, 0, arguments.length - 1),
                            appConfig = arguments[arguments.length - 1];

                        configs.forEach(function (config) {
                            config(window.appModule);
                        });

                        appConfig(window.appModule, function () {
                            angular.bootstrap(document, [APP_MODULE_NAME]);
                        });
                    }

                    //On load function will be bound to window object if post processing needed.
                    window.onModulesLoaded && window.onModulesLoaded();
                });
            });
        }
    });
});
