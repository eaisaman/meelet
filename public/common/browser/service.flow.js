define(
    ["angular-lib", "jquery-lib", "underscore-lib", "app-util", "app-service-registry"],
    function () {
        return function (appModule, extension, meta) {
            var FEATURE = "FlowService",
                PLATFORM = "browser",
                FlowService = function ($rootScope, $http, $timeout, $q, $exceptionHandler, $compile, $cookies, $cookieStore, utilService, angularConstants, angularEventTypes, serviceRegistry) {
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
                };

            FlowService.$inject = ["$rootScope", "$http", "$timeout", "$q", "$exceptionHandler", "$compile", "$cookies", "$cookieStore", "utilService", "angularConstants", "angularEventTypes", "serviceRegistry"];

            FlowService.prototype.registerService = function () {
                this.serviceRegistry && this.serviceRegistry.register(this, FEATURE, PLATFORM);
            };

            FlowService.prototype.unregisterService = function () {
                this.serviceRegistry && this.serviceRegistry.unregister(FEATURE, PLATFORM);
            };

            FlowService.prototype.saveFlow = function (projectId, flowWorks) {
                return this.$http({
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    method: 'POST',
                    url: '/api/public/flow',
                    data: $.param({
                        projectId: projectId,
                        flowWorks: JSON.stringify(flowWorks)
                    })
                });
            };

            FlowService.prototype.loadFlow = function (projectId) {
                var self = this;

                return self.$http({
                    method: 'GET',
                    url: '/api/public/flow',
                    params: {projectId: projectId}
                }).then(function (result) {
                        if (result.data.result === "OK") {
                            var resultValue = JSON.parse(result.data.resultValue);
                            return self.utilService.getResolveDefer(resultValue);
                        } else {
                            return self.utilService.getRejectDefer(result.data.reason);
                        }
                    },
                    function (err) {
                        return self.utilService.getRejectDefer(err);
                    }
                );
            };

            appModule.
                config(["$provide", "$injector", function ($provide, $injector) {
                    $provide.service('flowService', FlowService);

                    var instance = $injector.get('flowServiceProvider').$get();
                    instance.registerService();
                }]);
        };
    }
)
;