define(
    ["angular-lib", "jquery-lib", "underscore-lib", "ng.ui.util", "ng.ui.service"],
    function () {
        var BookService = function ($parse, $timeout, $q, $exceptionHandler, $compile, $rootScope, angularEventTypes, angularConstants, appService, uiUtilService, uiCanvasService, uiAnimationService) {
            this.$parse = $parse;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$exceptionHandler = $exceptionHandler;
            this.$compile = $compile;
            this.$rootScope = $rootScope;
            this.angularEventTypes = angularEventTypes;
            this.angularConstants = angularConstants;
            this.appService = appService;
            this.uiUtilService = uiUtilService;
            this.uiCanvasService = uiCanvasService;
            this.uiAnimationService = uiAnimationService;

            _.extend($inject, _.pick(this, BookService.$inject));

            defineBookClass(uiUtilService.createObjectClass, uiUtilService.findObjectClass);
        };

        BookService.$inject = ["$parse", "$timeout", "$q", "$exceptionHandler", "$compile", "$rootScope", "angularEventTypes", "angularConstants", "appService", "uiUtilService", "uiCanvasService", "uiAnimationService"];
        var $inject = {};

        function defineBookClass(Class, FindClass) {
            var BookProject = Class(FindClass("Project"), {
                    CLASS_NAME: "BookProject",
                    MEMBERS: {
                    },
                    initialize: function (projectRecord) {
                        this.initialize.prototype.__proto__.initialize.apply(this, [projectRecord]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    }
                });

            BookService.prototype.loadProject = function (dbObject) {
                var self = this;

                if (!_.isEmpty(self.$rootScope.loadedProject)) {
                    self.$rootScope.loadedProject.unload();
                }
                self.$rootScope.loadedProject = new BookProject(dbObject);

                //FIXME Need display error alert here.
                return this.uiUtilService.chain(
                    [
                        function () {
                            return self.$rootScope.loadedProject.loadDependencies();
                        },
                        function () {
                            return self.$rootScope.loadedProject.loadResources();
                        },
                        function () {
                            return self.$rootScope.loadedProject.loadSketch();
                        },
                        function () {
                            self.$rootScope.$broadcast(self.angularEventTypes.switchProjectEvent, self.$rootScope.loadedProject);

                            return self.$rootScope.loadedProject.tryLock(self.$rootScope.loginUser._id);
                        }
                    ]
                );
            }
        }

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('uiBookService', BookService);
                }]);
        };
    }
)
;