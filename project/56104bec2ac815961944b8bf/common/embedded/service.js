define(
    ["angular-lib", "jquery-lib", "underscore-lib", "app-util", "app-service-registry"],
    function () {
        return function (appModule, extension, meta) {
            var FEATURE = "BaseService",
                PLATFORM = "embedded",
                appService = function ($rootScope, $http, $timeout, $q, $exceptionHandler, $compile, $cookies, $cookieStore, utilService, angularConstants, angularEventTypes, serviceRegistry) {
                    this.$rootScope = $rootScope;
                    this.$http = $http;
                    this.$timeout = $timeout;
                    this.$q = $q;
                    this.$exceptionHandler = $exceptionHandler;
                    this.$compile = $compile;
                    this.$cookies = $cookies;
                    this.$cookieStore = $cookieStore;
                    this.utilService = utilService;
                    this.serviceRegistry = serviceRegistry;
                    this.angularConstants = angularConstants;
                    this.angularEventTypes = angularEventTypes;
                    this.meta = angular.copy(meta);
                };

            appService.$inject = ["$rootScope", "$http", "$timeout", "$q", "$exceptionHandler", "$compile", "$cookies", "$cookieStore", "utilService", "angularConstants", "angularEventTypes", "serviceRegistry"];

            appService.prototype.registerService = function () {
                this.serviceRegistry && this.serviceRegistry.register(this, FEATURE, PLATFORM);
            };

            appService.prototype.unregisterService = function () {
                this.serviceRegistry && this.serviceRegistry.unregister(FEATURE, PLATFORM);
            };

            appService.prototype.toggleWidgetSound = function() {
                console.log("embedded");
                return this.utilService.getResolveDefer();
            }

            window.cordova && appModule.
                config(["$provide", "$injector", function ($provide, $injector) {
                    $provide.decorator("appService", ["$delegate", function($delegate) {
                        _.extend($delegate.constructor.prototype, appService.prototype);
                        return $delegate;
                    }]);;

                    $provide.service('embeddedAppService', appService);
                    var svc = $injector.get('embeddedAppServiceProvider').$get();
                    svc.registerService();
                }]);
        };
    }
)
;